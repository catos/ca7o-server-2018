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