var Class = require("infrastructure/lib/Class");
var path  = require("path");
require("colors");


module.exports = Class.extend("WebpackApplication", {
  constructor: function(env){
    var baseConfig = this.baseConfig;
    var webpack    = env.engines.webpack;
    var dirPath    = this.dirPath;

    var entry = {};
    entry[this.name] = path.join(this.dirPath, this.entry);

    var watch = (typeof this.watch === "boolean") ? this.watch : env.config.webpak.watch;

    var webpackOptions = this.webpackOptions = {

      context: env.config.rootDir,
      entry: entry,

      output: {
        filename:   path.join(env.config.rootDir, "\n"+env.config.webpack.buildDestination.js, this.bundleName || "[name].bundle.js"),
        publicPath: this.pubicPath || '/',
      },
    };

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
  }


})