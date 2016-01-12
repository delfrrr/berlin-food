/**
 * @file express app showing map
 */

var program = require('commander');
var packagejson = require('./../package.json');
var express = require('express');
var app = express();
var R = require('react');
var RDS = require('react-dom/server');
var MAP_BOX_TOKEN = 'pk.eyJ1IjoiZGVsZnJyciIsImEiOiJjaWkyYWRmdncwMG1sdG9rZmozdGZ3bnFoIn0.ARqPIvrkYl2hIXauNK3PLA';
var webpackMiddleware = require('webpack-dev-middleware');
var webpack = require('webpack');
var path = require('path');

program
    .version(packagejson.version)
    .option('-p, --port [number]', 'port', Number, 3000)
    .option('-s, --socket [string]', 'socket/ip', String, '127.0.0.1')
    .description('Express app showing map');
program.parse(process.argv);

app.use(webpackMiddleware(webpack({
    entry: {
        'map-page': require.resolve('../components/map-page'),
        'map-gl-page': require.resolve('../components/map-gl-page')
    },
    output: {
        path: '/',
        filename: '/components/[name].js',
        pathinfo: true
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
        'mapbox': 'L',
        'mapboxgl': 'mapboxgl'
    }
}), {
    publicPath: '/'
}));

app.get('/', function (req, res) {
    res.type('html');
    res.send(RDS.renderToStaticMarkup(R.DOM.html(
        null,
        R.DOM.head(
            null,
            R.DOM.title(null, packagejson.description),
            R.DOM.meta({
                name: 'viewport',
                content: 'width=device-width, initial-scale=1, user-scalable=no'
            }),
            R.DOM.link({
                rel: 'stylesheet',
                type: 'image/png',
                href: '//api.mapbox.com/mapbox.js/v2.2.3/mapbox.css'
            })
        ),
        R.DOM.body(
            null,
            R.DOM.script({
                src: '//api.mapbox.com/mapbox.js/v2.2.3/mapbox.js'
            }),
            R.DOM.script({
                dangerouslySetInnerHTML: {
                    __html: 'L.mapbox.accessToken = \'' + MAP_BOX_TOKEN + '\';'
                }
            }),
            R.DOM.script({}, 'window.__DEV__ = true;'),
            R.DOM.script({
                src: 'https://fb.me/react-0.14.3.js'
            }),
            R.DOM.script({
                src: 'https://fb.me/react-dom-0.14.3.js'
            }),
            R.DOM.script({
                src: '/components/map-page.js'
            })
        )
    )));
});

app.get('/gl', function (req, res) {
    res.type('html');
    res.send(RDS.renderToStaticMarkup(R.DOM.html(
        null,
        R.DOM.head(
            null,
            R.DOM.title(null, 'Map box gl demo'),
            R.DOM.meta({
                name: 'viewport',
                content: 'width=device-width, initial-scale=1, user-scalable=no'
            }),
            R.DOM.link({
                rel: 'stylesheet',
                href: '//api.tiles.mapbox.com/mapbox-gl-js/v0.12.2/mapbox-gl.css'
            })
        ),
        R.DOM.body(
            null,
            R.DOM.script({
                src: '//api.tiles.mapbox.com/mapbox-gl-js/v0.12.2/mapbox-gl.js'
            }),
            R.DOM.script({
                dangerouslySetInnerHTML: {
                    __html: 'mapboxgl.accessToken = \'' + MAP_BOX_TOKEN + '\';'
                }
            }),
            R.DOM.script({}, 'window.__DEV__ = true;'),
            R.DOM.script({
                src: 'https://fb.me/react-0.14.3.js'
            }),
            R.DOM.script({
                src: 'https://fb.me/react-dom-0.14.3.js'
            }),
            R.DOM.script({
                src: '/components/map-gl-page.js'
            })
        )
    )));
});

app.use('/geojson', express.static(path.resolve(__dirname + '/../geojson')));


app.listen(program.port, program.socket, function () {
    console.log('map started at %s:%j', program.socket, program.port);
});
