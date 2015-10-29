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
