const path = require('path');
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")


module.exports = {
  mode: 'production', // or 'production'
  entry: './src/background.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'background.bundle.js',
  },
  target: 'webworker', // Necessary for Chrome Extensions
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js'] // Automatically resolve .js extensions
  },
  plugins: [
    new NodePolyfillPlugin()
  ]

};
