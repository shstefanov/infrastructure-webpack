module.exports = function(structure_name, cb){
  var env    = this;
  var path   = require("path");

  var structure_config = env.config.structures[structure_name];

  env.structureLoader(structure_name, function setupWebpack(name, Appliction, filepath_str){
    // Set folder name by default, if not set
    if(!Appliction.prototype.name) Appliction.prototype.name = filepath_str.slice(-2, 1).pop();
    // Copy base config and attach it to every ebpack node
    Appliction.prototype.baseConfig = JSON.parse(JSON.stringify( structure_config || {}));
    // Compile directory wher application files are placed
    Appliction.prototype.dirPath = path.join(
      env.config.rootDir,
      Array.isArray(structure_config.path) ? structure_config.path[0] : structure_config.path,
      filepath_str.slice(0,-1).join(path.sep)
    );
    // We targeting folders, so return a hack to set the instance into parent place
    return {
      setupNode: function(cb){
        var bundler = new Appliction(env, structure_name, name);
        bundler.__onready = cb;
        env.helpers.patch(env.i[structure_name], filepath_str.slice(0,-1).join("."), bundler );
      }
    }
  }, cb,  structure_config.wrapped );
};
