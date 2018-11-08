
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
 * https://webpack.js.org/guides/code-splitting/
 * 
 */

const path = require('path');
// const nodeExternals = require('webpack-node-externals');

module.exports = {
    target: 'node',
    mode: 'production', // 'development'
    devtool: 'inline-source-map',
    entry: {
        server: './src/server.ts'
    },
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
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].bundle.js',
    },
};


/**
 * 
 * SEPARATE VENDOR FILE
 * 
 */
// const path = require('path');
// // const nodeExternals = require('webpack-node-externals');

// module.exports = {
//     target: 'node',
//     mode: 'production', // 'development'
//     devtool: 'inline-source-map',
//     entry: {
//         server: './src/server.ts'
//     },
//     module: {
//         rules: [
//             {
//                 test: /\.tsx?$/,
//                 use: 'ts-loader',
//                 exclude: /node_modules/
//             }
//         ]
//     },
//     resolve: {
//         extensions: ['.tsx', '.ts', '.js']
//     },
//     optimization: {
//         // runtimeChunk: 'single',
//         namedModules: true,
//         namedChunks: true,
//         splitChunks: {
//             chunks: 'all'
//             // cacheGroups: {
//             //     vendor: {
//             //         test: /node_modules/,
//             //         chunks: "initial",
//             //         name: "vendor",
//             //         enforce: true
//             //     }
//             // }
//         }
//     },
//     output: {
//         path: path.resolve(__dirname, 'dist'),
//         filename: '[name].bundle.js',
//         chunkFilename: '[name].bundle.js',
//     },
// };