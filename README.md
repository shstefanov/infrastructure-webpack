Installation
============

    npm install infrastructure-webpack


Configuration
=============

This module works with infrastructure (https://github.com/shstefanov/infrastructure). It means that configuration should looks something like:

Engine configuration (config.webpack):

```javascript
{
  "buildDestination": "./public/dist", // Required - where bundle builds will be placed
  "publicPath":       "/public/dist",  // TODO

  "watch":            false,           // Optional - watch changes anr rebuild bundles, default false
  "progress":         false,           // Optional - turn on and off progress reporting, default false
  "sourceMap":        false,           // Optional - add source map to bundles, default false, default false
  "colors":           true,            // Optional - use or not colored output when reporting, default false
  "minify":           true,            // Optional - minify or not the code, default false

  // How to report some stuff
  // It means some structure target will be called
  // 2 parameters will be passed to structure target
  // [ title, message ], without callback
  "reportProgress":   "log.info",      // Optional - defaults to "log.info"
  "reportSummary":    "log.info",      // Optional - defaults to "log.sys"
  "reportErrors":     "log.error",     // Optional - defaults to "log.error"
  "reportWarnings":   "log.warning",   // Optional - defaults to "log.warning"

  // It is per instance option, this is used as global config
  // in case some of instances don't have this option set
  // Read instance options for more
  "commonLoaders":    true,


  // Optional. If set, it will setup webpack's CommonsChunkPlugin
  // And will extract defined in the array libs in separate bundle,
  // named in this case "libs_bundle_name"
  "commonChunks": {
    "libs_bundle_name" : [
      "underscore",
      "backbone",
      "jquery"
    ]
  },

  // Optional
  // Define some aliases. It means that in your bundle files
  // require("key") will resolve defined path as follows:
  //   - paths with leading "./" will be resolved based on project root
  //   - paths with leading "/" will be resolved as is
  //   - paths starting with word will be resolved from node_modules packages
  // Note: paths that leading to folder wil be autoaliased.
  // It means the files inside target folder can be resolved like:
  // require("lib/controlers/MainController.js")
  "alias": {
    "settings":  "./bundles/lib/settings.js",
    "resources": "./bundles/resources",
    "View": "infrastructure-appcontroller-ractive/ractive-backbone-view.js",
    "lib":  "./bundles/lib"
  },

  // Optional - defaults to "/".
  // This affects only autoaliased targets.
  // If aliasSeparator is defined as "--", autoaliased target will be resolved as:
  // require("lib--controlers--MainController.js")
  "aliasSeparator": "/",


  // Optional.
  // Extract specific file types to specific destination
  "fileLoaders": [
    {
      "extensions": ["gif","jpe?g","png","svg","bmp"],
      "destination": "images/[name].[hash].[ext]"
    },
    {
      "extensions": ["woff","woff2","eot","ttf"],
      "destination": "fonts/[name].[hash].[ext]"
    }
  ],

  // Optional.
  // If defined, it will use webpack's DefinePlugin to 
  // expose some values inside bundle files.
  // It can resove it's value from config tree as:
  "define": "@config.bundles",

  // Or can be defined more specific with option every child unit
  // it resolve it's value from config tree or from ENV variables,
  // if value is string, leading with "@config" or "@env", otherwise 
  // will just pass the value
  "define": {
    "ADMIN_CONFIG":   "@config.bundles.ADMIN_CONFIG",
    "DEFAULT_ROUTES": "@config.bundles.DEFAULT_ROUTES",
    "HOST":           "@env.HOST",
    "BAR":            "normal string",
    "BAZ":            ["other json"]
  }


}
```

Structure configuration:

Under config.structures.your_structure_name, set the following:

```javascript
{
  // Required - which engine to load in this structure
  "engine":   "infrastructure-webpack/engine",
  // or:
  "engines":  ["infrastructure-webpack/engine"],
  

  // Optional.
  // Standart structure option.
  // It uses bulk-require package to resolve some pattern
  // It can not be defined, if "instances" object is defined
  // to configure structure units
  "path":   "bundles",
  // or
  "path":   ["bundles", "*.js"    ],
  // To be more specific


  // Optional - unit definitions, using structure.instances config
  "instances": {
    
    // Unit name
    "admin": {

      // Required - prototype to extend
      // and again:
      // - paths with leading "./" will be resolved based on project rot folder
      "prototype": "./lib/bundles/BaseBundle.js",
      // - paths with leading "/" will be resolved as is
      "prototype": "/var/www/app/lib/bundles/BaseBundle.js",
      // - paths starting with word will be resolved from node_modules packages
      "prototype": "npm-dependency-name",


      // Required - target folder, relative to structure.path folder
      "target": "./admin",


      // Optional
      // The bundle may depend on packages, that are extracted 
      // from CommonChunksPlugin in separate bundle, so in order to work
      // properly, the bundle should have needed lib-chunks name in this array
      // The lib_bundle assets will be added to this chunk assets
      "chunks": [ "libs_bundle_name" ],


      // Optional - custom scripts and styles to be loaded with this bundle assets
      "assets": {
        "javascript": ["url_1", "url_2"],
        "styles":     ["url_3", "url_4"],
      },


      // Optional - bundle specific custom aliases, relative to target folder
      "alias": {
        "admin.data": "data.js"
      },


      // Optional
      // If set to true, the bundle's target directory will be 
      // autoaliasified with unit name as prefix
      "aliasify": true,

      // Optional - uses config.webpack.aliasSeparator as default
      // Which separator to use for this bundle files
      // if aliasify option is true 
      "aliasSeparator": "/",

      // Optional - defaults false
      // If true, it adds some loaders to this bundle loaders
      // - loader for loading .coffee files
      // - loader for loading .html files as string
      // - loader for loading .jade files as html string
      // - loaders for loading .json, .hson and .yml files as json objects
      // - loaders for loading .css, .less, .scss files
      "commonLoaders" : true,


      // Optional - some custom loaders
      // Note - infrastructure-webpack constructor will modify test regex 
      // to match files in bundle's target directory only.
      // Also, in json format, test regex should be string and may be tricky

      "loaders": [
        {"test": "/\.jsx$/", "loader": "babel-loader"}
      ]



    }
    
  }
}
```

Same unit definition, but using javascript file in structure.path directory
```javascript
// bundles/admin.js
var Bundler = require("../lib/bundles/BaseBundle.js");
module.exports = Bundler.extend("AdminBundler", {
  target: "./admin",
  chunks: [ "libs_bundle_name" ],
  assets: {
    javascript: ["url_1", "url_2"],
    styles:     ["url_3", "url_4"],
  },
  alias: {
    "admin.data": "data.js"
  },
  aliasify: true,
  loaders: [
    { test: /\.jsx$/, loader: "babel-loader" }
  ]
    });
```