const fs                = require("fs");
const path              = require("path");
const webpack           = require("webpack");
const _                 = require("underscore");
const Deduplicator      = require("./Deduplicator.js");
const ProgressPlugin    = require('webpack/lib/ProgressPlugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const EventedClass      = require("infrastructure/lib/EventedClass");

module.exports = EventedClass.extend("WebpackBundler", {
  constructor: function(env){
    
    this.env = env;
    this.config = env.config.webpack;

    _.defaults(this.config, {
      reportProgress: "log.info",
      reportSummary:  "log.sys",
      reportErrors:   "log.error",
      reportWarnings: "log.warning",
    });

    this.bundles = new Map();

    if(this.config.colors) require("colors");

    this.createReporters();

    env.stops.push((cb)=>{ this.stop(cb); });

  },

  addBundle: function(bundle){
    this.bundles.set(bundle.name, bundle);
  },

  removeBundle: function(bundle){
    this.bundles.delete(bundle.name);
  },

  compile: function(){
    const helpers = this.env.helpers;
    this.createBaseConfig();

    if(this.config.alias){
      for(var alias_name in this.config.alias){
        var alias_target = this.config.alias[alias_name];
        if(alias_target.indexOf(".") === 0){
          let target_path = path.join(this.env.config.rootDir, alias_target);
          this.autoAliasify(target_path, [alias_name], this.config.aliasSeparator || "/");
        }
        else if(alias_target.indexOf("/") === 0){
          this.autoAliasify(alias_target, [alias_name], this.config.aliasSeparator || "/");
        }
        else{
          this.webpack_options.resolve.alias[alias_name] = alias_target;
        }
      }
    }

    for(let bundle of this.bundles.values()){
      if(bundle.commonLoaders === true){
        this.webpack_options.module.loaders = this.webpack_options.module.loaders.concat(bundle.createLoaders(this));
        this.webpack_options.entry[bundle.name] = bundle.getEntryPoints();
        if(bundle.aliasify === true){
          this.autoAliasify(bundle.context_path, [bundle.name], bundle.aliasSeparator || this.config.aliasSeparator || "/");
        }

        let asset_url_tpl = this.webpack_options.output.filename.replace(this.env.config.rootDir, "");

        const bundle_chunks = Object.keys(this.config.commonChunks)
          .filter((chunk_name)=>{ return (bundle.chunks||[]).indexOf(chunk_name) > -1; })
          .concat([bundle.name]);

        let bundle_javascripts = bundle_chunks.map((chunk_name)=>{
          return path.join(asset_url_tpl.replace(/\[name\]/g, chunk_name));
        });

        let bundle_styles = bundle_chunks.map((chunk_name)=>{
          return path.join(asset_url_tpl.replace(/\[name\]/g, chunk_name)).replace(/\.js$/, ".css");
        });

        bundle.assets.javascripts = bundle.assets.javascripts.concat(bundle_javascripts);
        bundle.assets.styles      = bundle.assets.styles.concat(bundle_styles);

        if(bundle.alias){
          for(var alias_name in bundle.alias){
            var alias_target = path.join( bundle.context_path, bundle.alias[alias_name]);
            this.webpack_options.resolve.alias[alias_name] = alias_target;
          }
          _.extend()
        }

      }
    }

    this.start();

  },

  autoAliasify: function (file_path, alias_parts, separator){
    const aliases = this.webpack_options.resolve.alias;
    if(fs.statSync(file_path).isDirectory()){
      var files = fs.readdirSync(file_path);
      for(var i = 0; i< files.length; i++){
        var new_path = path.join(file_path, files[i]);
        var new_alias_parts = alias_parts.concat([files[i]]);
        this.autoAliasify(new_path, new_alias_parts, separator);
      }
    }
    else{
      aliases[alias_parts.join(separator)] = file_path;
    }
  },

  createBaseConfig: function(){
    const webpack_options = this.webpack_options = {
      context: path.join(this.env.config.rootDir),
      entry:   {},
      resolve: {
        alias: {},
        modulesDirectories: [
          "web_modules", 
          "node_modules", 
        ],

      },

      output: {
        filename:   path.join(
          this.env.config.rootDir,
          this.env.config.webpack.buildDestination,
          "[name]/[name].bundle.js"
        ),
        publicPath: "/"
      },

      module: {
        loaders: [
          { test: /backbone.js$/, loader:"imports?define=>false&_=>require('underscore')"   },
        ]
      },

      plugins: [
        new webpack.optimize.OccurenceOrderPlugin(false),
        new Deduplicator({clone: false}),
        new ExtractTextPlugin( 
          path.join( this.env.config.webpack.buildDestination, "[name]/[name].bundle.css"),
          { allChunks: true }
        )
      ]
    };

    if(this.config.sourceMap === true){
      webpack_options.devtool = "source-map";
      webpack_options.output.sourceMapFilename = "[file].map";
    }

    if(this.config.commonChunks){
      for(var chunk_name in this.config.commonChunks){
        var chunk_modules = this.config.commonChunks[chunk_name];
        webpack_options.entry[chunk_name] = chunk_modules;
        var output = path.join(this.env.config.webpack.buildDestination, "[name]/[name].bundle.js");
        webpack_options.plugins.push( new webpack.optimize.CommonsChunkPlugin(chunk_name, output) );
      }
    }

    if(this.config.fileLoaders){
      for (let file_loader of this.config.fileLoaders){
        var test_re = new RegExp(`\\.(${file_loader.extensions.join("|")})([\\?#].*)?$`, "i");
        var dest = path.join(this.config.buildDestination, file_loader.destination || "_files_[ext]/[name].[hash].[ext]");
        var loader = `url?limit=${file_loader.inlineLimit || 1}&name=${dest}`
        webpack_options.module.loaders.push({
          test: test_re,
          loader: loader,
        });
      }
    }

    if(this.config.define){
      var defines;
      var resolve_source = {
        config: this.env.config,
        env:    process.env,
      };
      if(typeof this.config.define === "string"){
        defines = this.env.helpers.resolve(resolve_source, this.config.define.replace(/^@/, "") );
      }
      else{
        var defines = {};
        for(var key in this.config.define){
          var value = this.config.define[key];
          if(typeof value === "string" && value.indexOf("@") === 0){
            var resolved_value = this.env.helpers.resolve(resolve_source, value.replace(/^@/, ""));
            if(resolved_value === undefined){
              resolved_value = value;
            }
            defines[key] = resolved_value;
          }
        }        
      }

      // Stringifying all values
      var stringified = {};
      for(var key in defines){
        stringified[key] = JSON.stringify(defines[key]);
      }

      webpack_options.plugins.push( new webpack.DefinePlugin( stringified ) );
    }

    if(this.config.progress){
      webpack_options.plugins.push(new ProgressPlugin(this.reportProgress) );
    }

    if(this.config.minify){
      webpack_options.plugins.push(new webpack.optimize.UglifyJsPlugin({minimize: true}));
    }

  },

  start: function(cb){
    const options = this.webpack_options;
    if(this.compiler){
      return this.stop((err)=>{
        this.start(options, cb);
      });
    }
    else {
      this.compiler = webpack(options);
      if(this.config.watch) {
        this.watcher = this.compiler.watch({ aggregateTimeout: 300, poll: true }, this.reportHandler);
      }
      else this.compiler.run(this.reportHandler);
      cb && cb();
    }
  },

  stop: function(cb){
    const watcher = this.watcher;
    delete this.compiler;
    delete this.watcher;
    if(watcher) watcher.close(cb);
    else cb && cb();
  },

  createReporters: function(){
    const env = this.env;
  
    const reportErrors = (errors)=>{
      errors.forEach((error)=>{
        var message = this.config.colors ? error.message.red : error.message;
        env.i.do(this.config.reportErrors, " Error ", message);
      });
    };

    const reportWarnings = (warnings)=>{
      warnings.forEach((warning)=>{
        var message = this.config.colors ? warning.message.yellow : warning.message;
        env.i.do(this.config.reportWarnings, " Warning ", message);
      });
    };

    const reportSummary = (stats)=>{
      var time      = stats.endTime - stats.startTime;
      var hash      = stats.hash;
      var time_stat = time + "ms";

      var assets_report = "\n\t"+Object.keys(stats.compilation.assets)
      .map((asset)=>{
        return "./" + asset.replace(this.env.config.rootDir + "/", "");
      }).join("\n\t");

      if(this.config.colors){
        hash = hash.green;
        assets_report = assets_report.green;
        if(time < 5000)       time_stat  = time_stat.green;
        else if(time < 10000) time_stat  = time_stat.yellow;
        else                  time_stat  = time_stat.red;
      }
      var message = "[ "+hash+" ] - " + time_stat;
      env.i.do(this.config.reportSummary, "Assets: ", assets_report );
      env.i.do(this.config.reportSummary, "Build summary: ", message );
      

    };

    // Report progress handler
    this.reportProgress = (int_progress, msg)=>{
      var progress = ( (int_progress * 100).toFixed()+"%" );
      if(this.config.colors) progress = progress.blue;
      env.i.do(this.config.reportProgress, "progress: "+progress+"", msg );
    };

    // Dispatches summary reports
    this.reportHandler = function(err, stats){
      if(err) return reportErros([err]);
      var json_stats = stats.toJson();
      if(stats.hasErrors)   reportErrors   ( stats.compilation.errors   );
      if(stats.hasWarnings) reportWarnings ( stats.compilation.warnings );
      reportSummary(stats, env);
    };
  },

});