const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/example-scroll.js',
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
    // Qui puoi aggiungere altri plugin di Webpack se necessari
  ],
  resolve: {
    // Qui puoi configurare come Webpack risolve i moduli
    extensions: ['.js'], // Estensioni dei file da considerare
  },
};
