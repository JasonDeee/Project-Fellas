const webpack = require("webpack");

module.exports = {
  // ... các cấu hình khác ...
  resolve: {
    fallback: {
      http: require.resolve("stream-http"),
      https: require.resolve("https-browserify"),
      stream: require.resolve("stream-browserify"),
      util: require.resolve("util/"),
    },
  },
  plugins: [
    // ... các plugin khác ...
    new webpack.ProvidePlugin({
      process: "process/browser",
    }),
  ],
};
