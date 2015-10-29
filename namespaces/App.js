// Main App namespace
var helpers = require("helpers");
var _ = require("underscore");

var App = module.exports = {
  
  bulk: function(context){
    var result = {};
    return _.chain( context.keys() )
      .filter(function(path){ return !!path.match(/\.[a-z]{2,6}$/i); })
      .map(function(path){
        var prop_name = path.replace(/^\.\//, "").replace(/\.js$/i, "");
        return [prop_name, context(path)];
     }).object().value();
  },

  config: function(conf){
    var config = require("config");
    _.extend(config, typeof conf === "function" ? App.bulk(conf) : conf );
  }

};
