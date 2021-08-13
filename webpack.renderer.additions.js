const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  module: {
    rules: [{
      test: /\.png$/,
      use: 'raw-loader'
    }],

  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "./src/renderer/assets", to: "./assets/" },
      ],
    })
  ]
}