const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: [
           './src/xwterm.js',
         ],
  output: {
    filename: 'xwterm.js',
    path: path.resolve(__dirname, 'dest'),
    library: 'AnsiTerm',
    libraryTarget: 'umd'
  },
  target: ['web', 'es5'],
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
             presets: ['@babel/preset-env'],
	     plugins: [
		     '@babel/plugin-transform-modules-commonjs',
		     'babel-plugin-transform-remove-strict-mode'
	     ],
          }
        },
      },
    ],
  },
  plugins: [
  ],
  resolve: {
    extensions: ['.js'],
  },
/*
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()]
  },
  */
};
