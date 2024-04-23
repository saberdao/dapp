const webpack = require('webpack');
const path = require('path');

exports.onCreateWebpackConfig = ({ actions, getConfig }) => {
    const config = getConfig();
    if (config.externals && config.externals[0]) {
        config.externals[0]['node:crypto'] = require.resolve('crypto-browserify');
    }
    actions.replaceWebpackConfig(config);

    actions.setWebpackConfig({
        plugins: [
            new webpack.ProvidePlugin({
                Buffer: ['buffer', 'Buffer'],
            }),
        ],
        resolve: {
            alias: {
                '@/src': path.resolve(__dirname, 'src'),
            },
            fallback: {
                crypto: require.resolve('crypto-browserify'),
                url: require.resolve('url/'),
                zlib: require.resolve('browserify-zlib'),
                https: require.resolve('https-browserify'),
                http: require.resolve('stream-http'),
                stream: require.resolve('stream-browserify'),
                assert: require.resolve('assert/'),
                buffer: require.resolve('buffer/'),
            },
        },
    });
};
