module.exports = function(){
  var env = this;

  return env.lib.Bundler.extend("PanelBundler", {
    name: "panel",
    //entry: "./panel.index.js",
    entry: ["./panel.index.js", "./panel.index.less"],
    filename: "js/panel.bundle.js", // Output fulename
    styleFilename: "css/panel.bundle.css", // Default "css/[name].bundle.css""
    publicPath: "/",
    watch: true,

    config: {
      HAHA: {aaa: 55}
    },

    fileLoaders: {
      "images": {
        extensions: ["gif", "jpe?g", "png", "svg", "bmp" ],
        inlineLimit: 1, // Defaults to 1
        name: "[hash].[ext]" // Default "[hash].[ext]"
      },
      "fonts": {
        extensions: ["woff", "eot", "ttf" ],
        inlineLimit: 1, // Defaults to 1
        name: "[hash].[ext]" // Default "[hash].[ext]"
      }
    }

  });

}



