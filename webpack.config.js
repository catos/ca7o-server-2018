// const webpack = require('webpack');
const path = require("path");
const nodeExternals = require('webpack-node-externals');

// Try the environment variable, otherwise use root
// const ASSET_PATH = process.env.ASSET_PATH || '/';

module.exports = {
    entry: "./src/server.ts",
    mode: "production",
    devtool: "inline-source-map",
    target: "node",
    output: {
        filename: "server.js",
        path: path.resolve(__dirname, "dist"),
        // publicPath: ASSET_PATH
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
        extensions: [".tsx", ".ts", ".js"]
    },
    // plugins: [
    //     // This makes it possible for us to safely use env vars on our code
    //     new webpack.DefinePlugin({
    //         'process.env.ASSET_PATH': JSON.stringify(ASSET_PATH)
    //     })
    // ],
    externals: [
        nodeExternals()
    ]
}