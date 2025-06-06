module.exports = {
  presets: [
              [
                '@babel/preset-env',
	  	{
			targets: ['ie 11'],
			useBuiltIns: 'usage',
			corejs: 3,
		},
              ],
            ],
  plugins: [
  	     '@babel/plugin-transform-modules-commonjs',
	     'babel-plugin-transform-remove-strict-mode'
  ]
}
