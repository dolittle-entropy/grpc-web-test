import { Configuration } from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import ReactRefreshTypeScript from 'react-refresh-typescript';
import 'webpack-dev-server';

const config: Configuration = {
    entry: './index.tsx',
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        getCustomTransformers: () => ({
                            before: [ReactRefreshTypeScript()],
                        }),
                        transpileOnly: true,
                    }
                }
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            templateContent: `
                <html>
                    <head>
                        <title>gRPC Web Contracts test</title>
                    </head>
                    <body>
                        <div id="root"/>
                    </body>
                </html>
            `
        }),
        new ReactRefreshWebpackPlugin(),
    ],
    devServer: {
        proxy: {
            '/grpc': {
                target: 'http://localhost:61052',
                pathRewrite: { '^/grpc': '' },
            },
        },
    },
}

export default config;
