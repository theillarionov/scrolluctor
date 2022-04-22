const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
//const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = merge(common, {
	watch: true,
	watchOptions: {
		ignored: /node_modules/,
	},
	mode: "development",
	output: {
		publicPath: "",
		filename: 'scrolluctor.js',
		path: path.resolve(__dirname, 'dev'),
	},
	stats: 'detailed',
	/*
	devServer: {
		static: {
			directory: path.join(__dirname, 'dist'),
		},
		compress: true,
		port: 9000,
		liveReload: true,
		hot: false,
		open: false,
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: './dist/index.html',
		}),
	]
	*/
});