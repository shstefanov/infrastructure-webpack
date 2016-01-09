var Class = require("infrastructure/lib/Class");
var path  = require("path");
var fs = require("fs");
var ExtractTextPlugin = require("extract-text-webpack-plugin");

var ProgressPlugin = require('webpack/lib/ProgressPlugin');

require("colors");

var _ = require("underscore");

// Modified version of webpack's DedupePlugin
var Deduplicator = require("./lib/Deduplicator");

// Loaders that will be active by default
var defaultLoaders = [

  // Json and YAML loaders
  { test: /\.json$/,      loader: "json"      },
  { test: /\.yml$/,       loader: "json!yaml" },
  
  // Coffeescrept loader
  { test: /\.coffee$/,    loader: "source-map!coffee-loader"            },
  
  // css and sass loaders
  { test: /\.scss$/,      loader: ExtractTextPlugin.extract("style-loader", "css-loader?sourceMap!autoprefixer!sass-loader"   )},
  { test: /\.css$/,       loader: ExtractTextPlugin.extract("style-loader", "css-loader?sourceMap!autoprefixer"               )},

  // Makes backbone missing jquery dependency to be not fatal error (warning)
  { test: /backbone.js$/, loader:"imports?define=>false&_=>require('underscore')"   }, 
];

var assetOptions = "url?limit={limit}&name={destination}"; // &minetype=image/{ext}


module.exports = Class.extend("Bundler", {
  constructor: function(env, structure_name, name){

    name = name.replace(/\.webpack$/, "");

    this.env       = env;
    var baseConfig = this.baseConfig;
    var webpack    = env.engines.webpack;
    var dirPath    = this.dirPath;
    var publicPath = this.publicPath || env.config.webpack.publicPath || "/";

    this.assets     = {
      javascripts: [],
      styles:     [],
    }; 

    var entry = {};
    if(Array.isArray( this.entry)){
      entry[this.name] = this.entry.map(function(entry){ return path.join(dirPath, entry); });
    }
    else entry[this.name] = path.join(this.dirPath, this.entry);

    // Resolve watch and progress options from object or from baseConfig
    var watch     = !!((typeof this.watch     === "boolean") ? this.watch     : env.config.webpack.watch     );
    var progress  = !!((typeof this.progress  === "boolean") ? this.progress  : env.config.webpack.progress  );
    var sourceMap = !!((typeof this.sourceMap === "boolean") ? this.sourceMap : env.config.webpack.sourceMap );

    // The options object
    var webpackOptions = this.webpackOptions = {

      context: process.cwd(),
     
      entry: entry,

      resolve: {
        alias: {
          App:     path.join(__dirname, "namespaces/App.js"     ),
          app:     path.join(__dirname, "namespaces/_app.js"    ),
          config:  path.join(__dirname, "namespaces/config.js"  ),
          helpers: "infrastructure/lib/helpers.js"
        },
        modulesDirectories: [
          "web_modules", 
          "node_modules", 

        // This will free most frontend packages from dependinf of infrastructure
        ].concat(_.chain(fs.readdirSync(path.join(env.config.rootDir, "node_modules")))
          .without(".bin")
          .map(function(dep){ return ["node_modules", dep, "node_modules"].join("/")})
          .value()
        )

      },

      resolveLoader: {
        modulesDirectories: [
          path.join(env.config.rootDir, "node_modules"),
          path.join(__dirname, "node_modules"),
          path.join(__dirname, "lib")
        ]
      },

      output: {
        filename:   path.join(env.config.rootDir, env.config.webpack.buildDestination, this.output || "[name].bundle.js"),
        publicPath: "/"
      },

      module: {
        loaders: defaultLoaders
      },

      plugins: [
        new webpack.optimize.OccurenceOrderPlugin(false),
        new Deduplicator({clone: false}),
        new ExtractTextPlugin( path.join(env.config.webpack.buildDestination, this.styleFilename || "[name].bundle.css"), { allChunks: true })
      ]
    };

    if(sourceMap){
      webpackOptions.devtool = "source-map";
      webpackOptions.output.sourceMapFilename = "[file].map";
    }

    var publicPathPrefix = path.join(env.config.rootDir, env.config.webpack.buildDestination)
    this.assets.javascripts .push(path.join(publicPath, webpackOptions.output.filename.replace(publicPathPrefix, "")));
    this.assets.styles      .push(path.join(publicPath, this.styleFilename));

    if(this.chunks){
      for(var chunk_name in this.chunks){
        var chunk_modules = this.chunks[chunk_name].modules;
        webpackOptions.entry[chunk_name] = chunk_modules;
        var output = path.join(env.config.webpack.buildDestination, this.chunks[chunk_name].output);
        webpackOptions.plugins.push( new webpack.optimize.CommonsChunkPlugin(chunk_name, output) );
        this.assets.javascripts.unshift( path.join(publicPath, this.chunks[chunk_name].output));
      }
    }

    var less_include_path = path.join(dirPath, "node_modules");
    webpackOptions.module.loaders.push({ test: /\.less$/,loader: ExtractTextPlugin.extract("style-loader", "css-loader?sourceMap!autoprefixer!less-loader?strictMath&noIeCompat"/*&includePath="+less_include_path*/)});
    
    if(this.scrapeRactiveTemplatesImages === true){
      webpackOptions.module.loaders.push({ test: /\.ractive\.jade$/, loader: "ractive-images-scraper!jade-html?pretty=false"      });
      webpackOptions.module.loaders.push({ test: /\.ractive\.html$/, loader: "ractive-images-scraper" });
    }
    else{
      webpackOptions.module.loaders.push({ test: /\.ractive\.jade$/, loader: "ractive!jade-html?pretty=false"});
      webpackOptions.module.loaders.push({ test: /\.ractive\.html$/, loader: "ractive" });
    }

    if(!this.CONFIG) this.CONFIG = {};

    this.aliasifyFolder(dirPath, [this.name], webpackOptions.resolve.alias);

    webpackOptions.plugins.push(new webpack.DefinePlugin( _.mapObject(this.CONFIG, function(val, key){
      if(typeof val === "function" || _.isRegExp(val)) return val.toString();
      return JSON.stringify(val);
    })));

    if(this.fileLoaders) this.addFilesLoaders(webpackOptions, env);
    if(this.loaders) webpackOptions.module.loaders = webpackOptions.module.loaders.concat(this.loaders);

    if(progress){
      webpackOptions.plugins.push(new ProgressPlugin(function(p, msg) {
        self.reportProgress(p, msg, env);
      }));
    }

    if(this.alias){
      _.extend( webpackOptions.resolve.alias, this.alias );
    }

    this.__webpackOptions = webpackOptions;

    var self = this;

    var reporter = this.__reporter = function(err, stats){

      if(err) {
        return self.__onready && self.__onready(err);
      }
      
      var json_stats = stats.toJson();

      if(stats.hasErrors)   self.reportErros    ( stats.compilation.errors,   env );
      if(stats.hasWarnings) self.reportWarnings ( stats.compilation.warnings, env );

      self.__onready && self.__onready();
      delete self.__onready;

      self.reportSummary(stats, env);

    };

    var rebuild = env.config.options.hasOwnProperty("rebuild")?env.config.options.rebuild : true;
    if(typeof rebuild === "string"){

      if(rebuild.indexOf(",")>0){
        var to_build = rebuild.split(",");
        rebuild = to_build.indexOf(name) > -1;
      }
      else if(rebuild === name) {
        rebuild = true;
      }
      else rebuid = false;
    }

    if(!rebuild) 
      setTimeout(function(self){ 
        console.log("SKIP BUILD", name);
        self.__onready();
      }, 10, this );
    else if(watch) this.watch();
    else this.build();
    
    env.stops.push(function(cb){ self.closeCompiler(cb); });

  },

  // Allow only these methods to be callable
  methods: [ "getAssets",  "watch",  "build",  "stop" ],

  getAssets: function(cb){
    cb(null, this.assets);
  },

  watch: function(cb){
    var self = this;
    this.createCompiler(null, function(err, compiler){
      if(err) return cb && cb(err);
      self.watcher = self.compiler.watch({ aggregateTimeout: 300, poll: true }, self.__reporter);
      cb && cb();
    });    
  },

  build: function(cb){
    var self = this;
    this.createCompiler(null, function(err, compiler){
      if(err) return cb && cb(err);
      self.compiler.run(self.__reporter);
      cb && cb();
    });    
  },

  stop: function(cb){
    this.closeCompiler(cb);
  },

  createCompiler: function(options, cb){
    var self = this;
    if(this.compiler){
      this.closeCompiler(function(err){
        if(err) return cb && cb(err);
        self.compiler = self.env.engines.webpack(options || self.__webpackOptions);
        cb && cb(err, self.compiler);
      });
    }
    else {
      this.compiler = this.env.engines.webpack(options || this.__webpackOptions);
      cb && cb();
    }
  },

  closeCompiler: function(cb){
    var self = this;
    if(this.watcher) {
      this.watcher.close(function(err){

        if(err) return cb && cb(err);
        delete self.watcher;
        delete self.compiler;
        cb && cb();
      });      
    }
    else {
      delete this.compiler;
      cb && cb();
    }
  },


  aliasifyFolder: function (file_path, alias_parts, ns){
    if(fs.statSync(file_path).isDirectory()){
      var files = fs.readdirSync(file_path);
      for(var i = 0; i< files.length; i++){
        var new_path = path.join(file_path, files[i]);
        var new_alias_parts = alias_parts.concat([files[i].replace(/\.(js|coffee)$/i, "")]);
        this.aliasifyFolder(new_path, new_alias_parts, ns);
      }
    }
    else{
      ns[alias_parts.join(".")] = file_path;
    }
  },

  reportErros: function(errors, env){
    var self = this;
    errors.forEach(function(error){ env.i.do("log.build", ("buid: "+self.name), error.message.red); });
  },

  reportWarnings: function(warnings, env){
    var self = this;
    warnings.forEach(function(warning){ env.i.do("log.build", ("buid: "+self.name), warning.message.yellow); });
  },

  reportProgress: function(p, msg, env){
    env.i.do("log.build", "progress: "+this.name +" ("+((p*100).toFixed()+"%").blue+")", msg );
  },

  reportSummary: function(stats, env){
    var time_color;
    var time = stats.endTime - stats.startTime;
    if(time < 2500)         time_color  = "green";
    else if(time < 7500)    time_color  = "yellow";
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
          test: new RegExp("(\\."+ext+"|\\."+ext+"[#?].*)$", "i"),
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

