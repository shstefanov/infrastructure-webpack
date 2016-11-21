Installation
============

    npm install infrastructure-webpack


Configuration
=============

Mount to config.structures (we will name the structure "bundles"):

```json
    "bundles": {
      "path":    ["client", "*/*.webpack.js"],
      "engine":  "infrastructure-webpack/engine",
      "loader":  "infrastructure-webpack/loader",

      "config": {
        "webpack": {
          "buildDestination":   "./public",
          "progress":           true,
          "watch":              true,
          "sourceMap":          true,
          "publicPath":         "/public"
        }
      }
    }
```

- "path" is folder where bundle builders are defined
- "engine" - the engine
- "loader" - the loader
- "config"  - the config


Usage
=====

In structure folder path create file of type (named for example ClientApplicationName.js):

```javascript
    var Bundler = require("infrastructure-webpack/Bundler");
    module.exports = Bundler.extend("PanelBundler", {
      name: "panel",
      //entry: "./panel.index.js",
      entry: ["./panel.index.js", "./panel.index.less"], // Accepts .css, .less and .sass
      output: "js/panel.bundle.js", // Output fulename - default "[name].bundle.js"
      styleFilename: "css/panel.bundle.css", // Default "css/[name].bundle.css"
      

      // We can override config options per bundle
      // publicPath: "/",
      // watch: true,
      // progress: true,
      // sourceMap: true,
      

      chunks: {
        // Add some libs to separate bundle

        // chunk name
        vendor: {
          output: "dist/game.vendor.js", // where bundle will be
          modules: [
            // List of package or module names
            "underscore",
            "backbone",
            "ractive/ractive.runtime.js"
          ]
        }
      },

      "loaders": [

      ],

      config: {
        SOME_CONFIG:  {aaa: 55},
        OTHER_CONFIG: {aaa: 77}
      },

      fileLoaders: {
        "images": { // This key is actually path, based on destination folder, specified in config
          extensions: ["gif", "jpe?g", "png", "svg", "bmp" ],
          inlineLimit: 1, // Defaults to 1
          name: "[hash].[ext]" // Default "[hash].[ext]"
        },
        "fonts": {
          extensions: ["woff", "eot", "ttf" ],
          inlineLimit: 1, // Defaults to 1
          name: "[hash].[ext]" // Default "[hash].[ext]"
        }
      }
    });
```

Features
========
Some features, provided from infrastructure-webpack for use in bundle files

```javascript

      // Built-in modules by infrastructure-webpack
      var App = require("App")       - namespace that will hold our classes and other stuff
      var app = require("app")       - instance if App.Controllers.AppController provided
      var config = require("config") - empty object that we can extend

      
      App.config(object) - extends the config with given object
      

      // Bulk folder and build config tree. Accepts .json, .yml, .hson, .xml and .js files
      App.config(require.context("./config", true))
      
      // Returns bulkified folder, filtered by pattern
      App.Controllers = App.bulk(require.context("./controllers", true, [/pattern/]) - 
      

      // Returns bulkified folder, filtered/modified by pattern and iterator
      App.bulk(require.context(folder, true, [/pattern/], function filter(name, context, cb){
        cb(null)   - omit this module from result
        cb("name") - set specific name for this module to mount on the result object
        cb(undefined, value) - keep name, set specific value
      }) - returns bulkified folder


```

v0.4.0
======

Make "bundles.name.build", "bundles.name.watch", "bundles.name.stop", "bundles.name.getAssets" targets callable from outside

  --rebuild cli option rebuilds all bundles
  --rebuild false skips bundle compile
  --rebuild=panel rebuilds only "panel" bundle
  --rebuild=panel,home rebuilds only "panel" and "home" bundles


v0.5

Adding hson-loader (loads hson files - https://github.com/timjansen/hanson)
Adding xml-loader (loads xml files as parsed json objects)

"scrapeRactiveTemplatesImages" option deprecated

.html and .jade files are loaded as HTML string

.CONFIG property of bundler can be string (dot notated path) which will be resolved from config tree