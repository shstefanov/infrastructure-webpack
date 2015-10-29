module.exports = function(cb){
  var env    = this;
  var path   = require("path");

  env.structureLoader("webpack", function setupWebpack(name, Appliction, filepath_str){
    // Set folder name by default, if not set
    if(!Appliction.prototype.name) Appliction.prototype.name = filepath_str.slice(-2, 1).pop();
    // Copy base config and attach it to every ebpack node
    Appliction.prototype.baseConfig = JSON.parse(JSON.stringify( env.config.webpack || {}));
    // Compile directory wher application files are placed
    Appliction.prototype.dirPath = path.join(
      env.config.rootDir,
      Array.isArray(env.config.structures.webpack.path) ? env.config.structures.webpack.path[0] : env.config.structures.webpack.path,
      filepath_str.slice(0,-1).join(path.sep)
    );
    // We targeting folders, so return a hack to set the instance into parent place
    return {
      setupNode: function(cb){
        env.helpers.patch(env.i.webpack, filepath_str.slice(0,-1).join("."), new Appliction(env));
        cb();
      }
    }
  }, cb, true );
};
