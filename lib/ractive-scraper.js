
var ractive_loader = require("ractive-loader");

  module.exports = function(source){

  var result =  ractive_loader.apply(this, arguments);
  
  return  result.replace(/"src":("[^"]+")/g, function(expr, match){
  	return expr.replace(match, "require("+match+")");
  });

}