var Class = require("infrastructure/lib/Class");
var path  = require("path");
var ExtractTextPlugin = require("extract-text-webpack-plugin");
require("colors");

var _ = require("underscore");

var Deduplicator = require("./lib/Deduplicator");

var defaultLoaders = [
  { test: /\.json$/,                   loader: "json"      },
  { test: /\.yml$/,                    loader: "json!yaml" },
  { test: /\.txt$/,                    loader: "raw"       },

  { test: /\.coffee$/,                 loader: "source-map!coffee-loader"            },

  { test: /\.ractive$/,                loader: "ractive-scraper"    },
  { test: /\.jade$/,                   loader: "ractive-scraper!jade-html?pretty=false"      },


  { test: /\.less$/,                   loader: ExtractTextPlugin.extract("style-loader", "css-loader?sourceMap!autoprefixer!less-loader"   )}, // ?includePath="+libPath
  { test: /\.scss$/,                   loader: ExtractTextPlugin.extract("style-loader", "css-loader?sourceMap!autoprefixer!sass-loader"   )},
  { test: /\.css$/,                    loader: ExtractTextPlugin.extract("style-loader", "css-loader?sourceMap!autoprefixer"               )},
];


module.exports = Class.extend("Bundler", {
  constructor: function(env){
    var baseConfig = this.baseConfig;
    var webpack    = env.engines.webpack;
    var dirPath    = this.dirPath;

    var entry = {};
    if(Array.isArray( this.entry)){
      entry[this.name] = this.entry.map(function(entry){ return path.join(dirPath, entry); });
    }
    else entry[this.name] = path.join(this.dirPath, this.entry);

    var watch = (typeof this.watch === "boolean") ? this.watch : env.config.webpak.watch;

    var webpackOptions = this.webpackOptions = {

      context: process.cwd(),
     
      entry: entry,

      resolve: {
        alias: {
          "style-loader": path.join(__dirname, "node_modules/style-loader")
        },
      },

      resolveLoader: {
        modulesDirectories: [
          path.join(env.config.rootDir, "node_modules"),
          path.join(__dirname, "node_modules"),
          path.join(__dirname, "lib")
        ]
      },

      output: {
        filename:   path.join(env.config.rootDir, env.config.webpack.buildDestination, this.filename || "[name].bundle.js"),
        publicPath: this.publicPath || '/',
      },

      module: {
        loaders: defaultLoaders
      },

      plugins: [
        new Deduplicator({clone: false}),
        new ExtractTextPlugin( path.join(env.config.webpack.buildDestination, this.styleFilename || "[name].bundle.css"), {
          allChunks: true
        })
      ]
    };

    if(this.config){
      webpackOptions.plugins.push(new webpack.DefinePlugin( _.mapObject(this.config, function(val){
        return JSON.stringify(val);
      })));
    }

    if(this.fileLoaders) this.addFilesLoaders(webpackOptions, env);
    if(this.loaders) webpackOptions.module.loaders = webpackOptions.module.loaders.concat(this.loaders);

    this.compiler = webpack(webpackOptions);
    var self = this;

    var reporter = function(err, stats){

      // if(err) return console.log("ERROR: ", err);
      
      var json_stats = stats.toJson();
      // console.log(stats.toJson());

      if(stats.hasErrors)   self.reportErros    ( stats.compilation.errors,   env );
      if(stats.hasWarnings) self.reportWarnings ( stats.compilation.warnings, env );

      self.reportSummary(stats, env);

    };



    if(watch){
      this.compiler.watch({
        aggregateTimeout: 300,
        poll: true
      }, reporter);
      env.stops.push(function(cb){ self.compiler.close(cb); });

    }
    else{
      this.compiler.run(reporter);
    }

    // this.compiler[watch ? "watch" : "run"](function(err, stats){

    // })


  },

  reportErros: function(errors, env){
    var self = this;
    errors.forEach(function(error){ env.i.do("log.build", ("buid: "+self.name), error.message.red); });
  },

  reportWarnings: function(warnings, env){
    var self = this;
    warnings.forEach(function(warning){ env.i.do("log.build", ("buid: "+self.name), warning.message.yellow); });
  },

  reportSummary: function(stats, env){
    var time_color;
    var time = stats.endTime - stats.endTime;
    if(time < 2500)         time_color  = "green";
    else if(time < 7500)    color       = "yellow";
    else                    time_color  = "red";
    env.i.do("log.build", "buid: "+this.name, "["+stats.hash.green+"] - "+( time + "ms")[time_color] );
  },

  addFilesLoaders: function(options, env){

    var self = this;

    for(var folder in this.fileLoaders){
      var filesDestination = path.join(
        env.config.webpack.buildDestination, 
        folder,
        this.fileLoaders[folder].filename || "[hash].[ext]"
      );

      var loaders = this.fileLoaders[folder].extensions.map(function(ext){
        return {
          test: new RegExp("\\."+ext+"$", "i"), 
          loader: assetOptions
            .replace("{limit}", (self.fileLoaders[folder].inlineLimit || 1))
            .replace("{destination}", filesDestination)
            // .replace("{ext}", ext)};
          };
      });
      options.module.loaders = options.module.loaders.concat(loaders);
    }

  }


});
var assetOptions = "url?limit={limit}&name={destination}"; // &minetype=image/{ext}

// var imgLoaders = {
//   gif: { test: /\.gif/i,   loader: assetsOptions.replace("{destination}", "images").replace("{ext}","gif" )  },
//   jpg: { test: /\.jpe?g/i, loader: assetsOptions.replace("{destination}", "images").replace("{ext}","jpg" )  },
//   png: { test: /\.png/i,   loader: assetsOptions.replace("{destination}", "images").replace("{ext}","png" )  },
//   svg: { test: /\.svg/i,   loader: assetsOptions.replace("{destination}", "images").replace("{ext}","svg" )  },
//   bpm: { test: /\.bpm/i,   loader: assetsOptions.replace("{destination}", "images").replace("{ext}","bpm" )  },
// }