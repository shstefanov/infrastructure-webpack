
module.exports = function(cb){

  var env = this;

  var webpack = require("webpack");
  env.engines.webpack = webpack;

  env.i.do("log.sys", "webpack", "Engine loaded" );

  return cb();

};
