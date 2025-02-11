const path = require('path');

module.exports = {
  mode: 'development',
  entry: [
           './src/index.js',
         ],
  output: {
    filename: 'scrollbar.js',
    path: path.resolve(__dirname, 'dest'),
  },
  target: ['web', 'es5'],
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
  plugins: [
  ],
  resolve: {
    extensions: ['.js'],
  },
};
