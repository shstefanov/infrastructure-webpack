var App = require("App");
module.exports = new App.Controllers.AppController();
var config = require("config");
if(config.debug === true) {
  window.app    = module.exports;
}