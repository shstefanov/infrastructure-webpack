var App = require("App");

module.exports = App.Controllers.AppController();

var config = require("config");

if(config.debug === true) {
	window.app    = module.exports; 
	window.App    = App;
	window.config = config;
}