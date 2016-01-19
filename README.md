Installation
============

    npm install infrastructure-webpack


Configuration
=============

In project_root/config/structures create webpack.json file with the following content:

    "webpack": {
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

- "path" is folder where bundle builders are defined
- "engine" - the engine
- "loader" - the loader
- "config"  - the config


Usage
=====

In structure folder path create file of type (named for example ClientApplicationName.js):
    var Bundler = require("infrastructure-webpack/Bundler");
    module.exports = Bundler.extend("PanelBundler", {
      name: "panel",
      //entry: "./panel.index.js",
      entry: ["./panel.index.js", "./panel.index.less"], // Accepts .css, .less and .sass
      output: "js/panel.bundle.js", // Output fulename - default "[name].bundle.js"
      styleFilename: "css/panel.bundle.css", // Default "css/[name].bundle.css"
      

      // These 4 options will default to config above
      publicPath: "/",
      watch: true,
      progress: true,
      sourceMap: true,
      

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

      scrapeRactiveTemplatesImages: true, // only for *.ractive.html and *.ractive.jade
      fileLoaders: {
        "images": {
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

v0.4.0
======

Make "bundles.name.build", "bundles.name.watch", "bundles.name.stop", "bundles.name.getAssets" targets callable from outside

  --rebuild cli option rebuilds all bundles
  --rebuild false skips bundle compile
  --rebuild=panel rebuilds only "panel" bundle
  --rebuild=panel,home rebuilds only "panel" and "home" bundles


v0.5

Adding hson-loader (loads hson files - https://github.com/timjansen/hanson )
Adding xml-loader (loads xml files as parsed json objects )

"scrapeRactiveTemplatesImages" option deprecated

.html and .jade files are loaded as HTML string

.CONFIG property of bundler can be string (dot notated path) which will be resolved from config tree