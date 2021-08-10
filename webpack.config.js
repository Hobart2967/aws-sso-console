const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  target: "electron-main",
  entry: {
    main: "./src/main/index.js"
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "./src/main/index.html", to: "./index.html" },
      ],
    })
  ]
};