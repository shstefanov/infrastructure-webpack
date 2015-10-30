// EntryPoint example


// Namespace accessible from every module that is included in the bundle with rquire("App")
// It's role is to keep Classes prototypes, may be some resources
var App         = require("App");

// Namespace accessible from every module that is included in the bundle with rquire("config")
// It's role is to keep all kind of configurations
// Initialy, it is empty object
var config = require("config");

// Instance of main AppController
// It requires App.Controllers.AppController to be prototype
var app = require("app");

// Extends the config with given data
// Pass true if you give require.context to it
App.config(require.context("./controllers", true));


require("App").bulk( require.context("./sections", true, /\.js$/), function(name, context, cb){

  // In this case, if we have ./sections/Header/Header.js
  // name will be Header/Header

  // module can be resolved using:
  // var module =  context(path);

  // the callback has following scenarios:

  // cb();                        // Just mount resolved module unders "name" key on result object
  // cb(null)                     // Omit this module, do not initialize and mount on resulting object

  // cb("SomeName")               // Mount module under given key on resulting object
  // cb("SumeName", SomeObject)   // Mount something custom under this key (can be null or undefined)
  // cb(undefined,  SomeObject)   // Keep the name as is and mount custom object

  // Note - only for .js files trailng extension will be removed from name

  cb(name.split("/").shift());
});


// App.bulk is like bulk-require in nodejs
App.Controllers = App.bulk(require.context("./controllers"));

app.init({// Data passed depends on what type of AppController is used
  App:          App,
  config:       require("config"),
  settings:     window.settings,
  routes:       require("./routes.json"),
  data:         require("data")
}, function(err){
  if(err) throw err;
  console.log("app initialized");
});
