const webpack = require("webpack");

module.exports = {
  webpack: {
    configure: {
      resolve: {
        fallback: {
          http: require.resolve("stream-http"),
          https: require.resolve("https-browserify"),
          stream: require.resolve("stream-browserify"),
          util: require.resolve("util/"),
          querystring: require.resolve("querystring-es3"),
          fs: require.resolve("browserify-fs"),
          path: require.resolve("path-browserify"),
          os: require.resolve("os-browserify/browser"),
          crypto: require.resolve("crypto-browserify"),
          child_process: false,
          tls: require.resolve("tls-browserify"),
        },
      },
      plugins: [
        new webpack.ProvidePlugin({
          process: "process/browser",
        }),
      ],
    },
  },
};
