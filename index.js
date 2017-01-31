const fs                = require("fs");
const path              = require("path");
const _                 = require("underscore");
const Class             = require("infrastructure/lib/Class");
const ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = Class.extend("AppBundler", {
  constructor: function(env, structure_name, node_name){
    this.env = env;

    if(!this.loaders) this.loaders = [];

    this.assets = this.assets || {};
    _.defaults(this.assets, { styles: [], javascripts: [] });

    if(!this.target) {
      return this.env.i.do("log.warn", structure_name, "No target is defined for bundle: " + [structure_name, node_name].join(".") );
    }

    this.name = node_name;

    var structure_config = env.config.structures[structure_name];
    var structure_path = Array.isArray(structure_config.path) ? structure_config.path[0] : structure_config.path;
    this.context_path = path.join(
      env.config.rootDir,
      structure_path,
      this.target
    );

    this.engine = env.engines.webpack_bundler;

    this.engine.addBundle(this);
    
  },

  getAssets: function(cb){
    cb(null, this.assets);
  },

  createLoaders: function(engine){
    var loaders = [];

    const this_bundle_context   = this.context_path.replace(/(\/)/g, "\\/") + "\\/";
    const css_source_map_option = engine.config.sourceMap ? "?sourceMap" : "";

    var common_loaders = false;
    if(this.commonLoaders !== undefined) common_loaders = this.commonLoaders;
    else common_loaders = engine.config.commonLoaders;

    if(common_loaders){
      loaders = loaders.concat([
        // Json and YAML loaders
        { test: new RegExp(this_bundle_context + "(.*)\\.json$"),   loader: "json-loader"                     },
        { test: new RegExp(this_bundle_context + "(.*)\\.hson$"),   loader: "hson-loader"                     },
        { test: new RegExp(this_bundle_context + "(.*)\\.yml$"),    loader: "json-loader!yaml-loader"         },
        // Coffeescrept loader
        { test: new RegExp(this_bundle_context + "(.*)\\.coffee$"), loader: "source-map-loader!coffee-loader" },

        // Markup loaders
        { test: new RegExp(this_bundle_context + "(.*)\\.jade$"),   loader: "raw!jade-html?pretty=false"      },
        { test: new RegExp(this_bundle_context + "(.*)\\.html$"),   loader: "raw"                             },

        // css, less and sass loaders
        { test:   new RegExp(this_bundle_context + "(.*)\\.scss$"),
          loader: ExtractTextPlugin.extract("style-loader", `css-loader${ css_source_map_option }!autoprefixer!sass-loader`   )},

        { test:   new RegExp(this_bundle_context + "(.*)\\.css$"),
          loader: ExtractTextPlugin.extract("style-loader", `css-loader${ css_source_map_option }!autoprefixer`               )},

        { test:   new RegExp(this_bundle_context + "(.*)\\.less$"),
          loader: ExtractTextPlugin.extract("style-loader", `css-loader${ css_source_map_option }!autoprefixer!less-loader?strictMath&noIeCompat`)},

      ]);
    }

    if(this.loaders) {
      loaders = loaders.concat(this.loaders.map((loader)=>{
        var loader_copy = Object.create(loader);
        var mods = (loader.test.toString().match(/^.*\/(\w+)$/) || [""]).pop();
        loader_copy.test = new RegExp(loader.test.toString().replace( /\/\^?(.*)\/\w*?$/, "^"+this_bundle_context+"(.+)$1"), mods );
        return loader_copy;
      }));
    }

    return loaders;
  },

  // Resolves *.index.* in bundle folder
  getEntryPoints: function(){
    return fs.readdirSync(this.context_path).filter((filename)=>{
      return filename.match(/\.index\./);
    }).map((filename)=>path.join(this.context_path, filename));
  }
});