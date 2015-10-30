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
        var  prop_name, module;
        if(iterator){
          var cb_called = false;
          iterator(prop_path, context, function(name, mod){
            prop_name = name, module = arguments.length < 2 ? (name === null ? module : context(path)) : mod;
          });
          if(prop_name === null) return null;
          if(!cb_called) module = context(path);
          if(prop_name === undefined) prop_name = prop_path;
        }
        else{
          prop_name = prop_path, module = context(path);
        }
        console.log("bulk", [prop_name, module]);
        return [prop_name, module];
     }).filter(_.isArray).object().value();
  },

  config: function(conf){
    var config = require("config");
    _.extend(config, typeof conf === "function" ? App.bulk(conf) : conf );
  }

};
