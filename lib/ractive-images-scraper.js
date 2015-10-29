
var ractive_loader = require("ractive-loader");

module.exports = function(source){

  var src_index = {};

  var re = /<img.*?src\s*?=\s*?["']?([^"']+)['"]?[^>]*>/gi;
  for(var src = re.exec(source); src !== null; src = re.exec(source) ){
    src_index[src[1]] = true;
  }


  var result =  ractive_loader.apply(this, arguments);

  for(var key in src_index){
    result = result.replace(new RegExp('"src":("'+key+'")', 'g'),  '"src": require($1)' );
  }
  
  return result;

}