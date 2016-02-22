/**
 * @file webpack config
 */
module.exports = {
    entry: {
        'map-gl-page': require.resolve('./components/map-gl-page/index.js')
    },
    output: {
        path: './',
        filename: './build/[name].js'
    },
    module: {
        loaders: [
            {
                test: /\.json$/,
                loader: "json"
            },
            {
                test: /\.less$/,
                loader: "style!css!less"
            }
        ]
    },
    externals: {
        'react': 'React',
        'react-dom': 'ReactDOM',
        'mapboxgl': 'mapboxgl'
    }
};
