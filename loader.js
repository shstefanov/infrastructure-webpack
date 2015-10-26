module.exports = function(cb){
  var env    = this;
  var path   = require("path");

  env.structureLoader("webpack", function setupWebpack(name, Appliction, filepath_str){
    if(!Appliction.prototype.name) Appliction.prototype.name = name.split(".").shift();
    Appliction.prototype.baseConfig = JSON.parse(JSON.stringify( env.config.webpack || {}));
    Appliction.prototype.dirPath = path.join(
      env.config.rootDir,
      Array.isArray(env.config.structures.webpack.path) ? env.config.structures.webpack.path[0] : env.config.structures.webpack.path,
      filepath_str.slice(0,-1).join(path.sep)
    );
    return new Appliction(env);
  }, cb, true );
};
