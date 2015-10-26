Installation
============

    npm install infrastructure-webpack


Configuration
=============

In project_root/config/structures create webpack.json file with the following content:

    "webpack": {
      "path": ["client", "*/*.webpack.js"],
      "engines": ["infrastructure-webpack/engine"],
      "loaders": ["infrastructure-webpack/loader"],
      "libs": {
        "ClientApplication": "infrastructure-webpack/ClientApplication"
      },

      "config": {
        "webpack": {
          "watch":  true,
          "buildDestination": {
            "js":     "./public/build/js",
            "css":    "./public/build/css",
            "images": "./public/build/images",
            "fonts":  "./public/build/fonts"
          }
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

    module.exports = function(){
      var env = this;

      return env.lib.ClientApplication.extend("ApplicationClassName", {
        name: "name",
        entry: "./name.index.js",
        bundleName: "[name].bundle.js", // webpack pattern
        publicPath: "/",
        watch: true // defaults to config option or false

      });

    }
