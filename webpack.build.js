const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = merge(common, {
	mode: "production",
	output: {
		filename: 'scrolluctor.js',
		path: path.resolve(__dirname, 'dist'),
		clean: true,
	},
	optimization: {
		minimizer: [
			new TerserPlugin({
				terserOptions: {
					/*
					mangle: false,
					compress: false,
					//https://github.com/terser/terser#minify-options
					//*/
					output: {
						//beautify: true
					}
				}
			})
		],
	},
});