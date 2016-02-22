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
var _ = require('lodash');
var fs = require('fs');

//TODO: find way to not override output
var webpackConfig = _.assign({}, require('../webpack.config'), {
    output: {
        path: '/',
        filename: '/components/[name].js',
        pathinfo: true
    }
});

program
    .version(packagejson.version)
    .option('-p, --port [number]', 'port', Number, 3000)
    .option('-s, --socket [string]', 'socket/ip', String, '127.0.0.1')
    .option('-e, --export [string]', 'export source to given folder', false)
    .description('Express app showing map');

program.parse(process.argv);

if (!program.export) {
    app.use(webpackMiddleware(webpack(webpackConfig), {
        publicPath: '/'
    }));
}

function getAppHtml() {
    return RDS.renderToStaticMarkup(R.DOM.html(
        null,
        R.DOM.head(
            null,
            R.DOM.title(null, 'Berlin Foood'),
            R.DOM.meta({
                name: 'viewport',
                content: 'width=device-width, initial-scale=1, user-scalable=no'
            }),
            R.DOM.link({
                rel: 'stylesheet',
                href: '//api.tiles.mapbox.com/mapbox-gl-js/v0.12.2/mapbox-gl.css'
            })
        ),
        program.export ?
        //prod
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
            R.DOM.script({
                src: 'https://fb.me/react-0.14.3.min.js'
            }),
            R.DOM.script({
                src: 'https://fb.me/react-dom-0.14.3.min.js'
            }),
            R.DOM.script({
                src: './map-gl-page.js'
            })
        ) :
        //dev
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

    ));
}

app.get('/', function (req, res) {
    res.type('html');
    res.send(getAppHtml());
});

app.use('/geojson', express.static(path.resolve(__dirname + '/../geojson')));


if (program.export) {
    var exportPath = path.join(process.cwd(),  program.export, 'index.html');
    console.log('Exporting:' + exportPath);
    fs.writeFileSync(exportPath, getAppHtml());
    process.exit(0);
} else {
    app.listen(program.port, program.socket, function () {
        console.log('Started at %s:%j', program.socket, program.port);
    });
}
