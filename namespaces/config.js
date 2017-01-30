const helpers = require("helpers");
module.exports = {
  get: function(path){
    return helpers.resolve(this, path);
  }
};