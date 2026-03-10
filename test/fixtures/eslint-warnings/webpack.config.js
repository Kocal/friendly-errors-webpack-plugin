const FriendlyErrorsWebpackPlugin = require('../../../index');
const ESLintPlugin = require('eslint-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: __dirname + "/index.js",
  output: {
    path: __dirname + "/dist",
    filename: "bundle.js"
  },
  plugins: [
    new FriendlyErrorsWebpackPlugin(),
    new ESLintPlugin({
      context: __dirname,
      files: ['**/*.js'],
      overrideConfigFile: __dirname + '/eslint.config.js',
    }),
  ],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      }
    ]
  }
};
