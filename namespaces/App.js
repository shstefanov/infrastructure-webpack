// Main App namespace
var helpers = require("helpers");
var _ = require("underscore");

var App = module.exports = {

  controllers: function(obj){
    if(typeof obj === "function"){
      App.Controllers = App.bulk(obj);
    }
    else{
      App.Controllers = obj;
    }
  },
  
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
            cb_called = true;
            prop_name = name, module = arguments.length < 2 ? (name === null ? module : context(path)) : mod;
          });
          if(prop_name === null) return null;
          if(!cb_called) module = context(path);
          if(prop_name === undefined) prop_name = prop_path;
        }
        else{
          prop_name = prop_path, module = context(path);
        }
        return [prop_name, module];
     }).filter(_.isArray).object().value();
  },

  configure: function(config, patch){
    var helpers     = require("helpers");
    var config_obj  = require("config");
    _.extend(config_obj, typeof config === "function" ? App.bulk(config, function(name, context, cb){
      cb(name.replace(/\.(js|json|yml|hson)$/i, ""));
    }) : config );

    if(patch) helpers.deepExtend(config_obj, patch);
    if(config_obj.debug) window.App = App;
  }

};
