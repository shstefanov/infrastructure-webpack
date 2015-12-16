Installation
============

    npm install infrastructure-webpack


Configuration
=============

In project_root/config/structures create webpack.json file with the following content:

    "webpack": {
      "path": ["client", "*/*.webpack.js"],
      "engines": ["infrastructure-webpack/engine"],
      "loader":  "infrastructure-webpack/loader",
      "libs": {
        "ClientApplication": "infrastructure-webpack/ClientApplication"
      },

      "config": {
        "webpack": {
          "watch":  true,
            "watch":  true,
            "buildDestination": "./public/dist",
            "sourceMap": true
        }
      }
    }

- "path" is folder where bundle builders are defined
- "engines" - the engine
- "loaders" - the loader
- "libs"    - the base class
- "config"  - the config


Usage
=====

In structure folder path create file of type (named for example ClientApplicationName.js):
    var Bundler = require("infrastructure-webpack/Bundler");
    return env.lib.Bundler.extend("PanelBundler", {
      name: "panel",
      //entry: "./panel.index.js",
      entry: ["./panel.index.js", "./panel.index.less"], // Accepts .css, .less and .sass
      filename: "js/panel.bundle.js", // Output fulename - default "[name].bundle.js"
      styleFilename: "css/panel.bundle.css", // Default "css/[name].bundle.css""
      publicPath: "/",
      watch: true,
      progress: true,
      sourceMap: true,
      scrapeRactiveTemplatesImages: true,

      config: {
        SOME_CONFIG:  {aaa: 55},
        OTHER_CONFIG: {aaa: 77}
      },

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

