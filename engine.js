
module.exports = function(cb){

  const env = this;
  const WebpackBundler = require("./lib/WebpackBundler.js");

  env.engines.webpack_bundler = new WebpackBundler(env);

  env.i.do("log.sys", "webpack", "Engine loaded" );

  // Hack - giving fake next-callback to next task in chain
  return cb(null, function(err){
    if(err) return cb(err);
    
    try{ env.engines.webpack_bundler.compile(); }
    catch(e){ return cb(e.stack || e) }

    try{ cb(); }
    catch(e){ return cb(e.stack || e) }
    cb();
  });

};
