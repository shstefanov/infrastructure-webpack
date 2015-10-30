// Main App namespace
var helpers = require("helpers");
var _ = require("underscore");

var App = module.exports = {
  
  bulk: function(context, iterator){
    var result = {};
    return _.chain( context.keys() )
      .filter(function(path){ return !!path.match(/\.[a-z]{2,6}$/i); }) // Omits module path without extensions
      .map(function(path){
        var prop_path = path.replace(/^\.\//, "").replace(/\.js$/i, "");
        var  prop_name, module = context(path);
        if(iterator){
          iterator(prop_path, module, function(name, mod){
            prop_name = name, module = arguments.length < 2 ? module : mod;
          });
          if(prop_name === null) return null;
          if(prop_name === undefined) prop_name = prop_path;
        }
        else{
          prop_name = prop_path;
        }

        return [prop_name, module];
     }).filter(_.isArray).object().value();
  },

  config: function(conf){
    var config = require("config");
    _.extend(config, typeof conf === "function" ? App.bulk(conf) : conf );
  }

};
