
/**
 * https://github.com/TypeStrong/ts-loader
 * https://webpack.js.org/plugins/commons-chunk-plugin/
 * https://github.com/webpack/webpack/tree/master/examples/common-chunk-and-vendor-chunk
 * https://webpack.js.org/concepts/targets/
 * https://medium.com/code-oil/webpack-javascript-bundling-for-both-front-end-and-back-end-b95f1b429810
 * https://www.npmjs.com/package/webpack-node-externals
 * Google: "webpack bundle node_modules separately"
 * https://stackoverflow.com/questions/30329337/how-to-bundle-vendor-scripts-separately-and-require-them-as-needed-with-webpack
 * 
 */

const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
    target: 'node',
    mode: 'development', // 'development'
    devtool: 'inline-source-map',
    entry: './src/server.ts',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    // optimization: {
    //     splitChunks: {
    //         cacheGroups: {
    //             // commons: {
    //             //     chunks: "initial",
    //             //     minChunks: 2,
    //             //     maxInitialRequests: 5, // The default limit is too small to showcase the effect
    //             //     minSize: 0 // This is example is too small to create commons chunks
    //             // },
    //             vendor: {
    //                 test: /node_modules/,
    //                 chunks: "initial",
    //                 name: "vendor",
    //                 priority: 10,
    //                 enforce: true
    //             }
    //         }
    //     }
    // },
    output: {
        filename: 'server.js',
        path: path.resolve(__dirname, 'dist')
    },
    externals: [nodeExternals()]
};