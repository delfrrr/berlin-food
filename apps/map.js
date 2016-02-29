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
    //webpack
    app.use(webpackMiddleware(webpack(webpackConfig), {
        publicPath: '/'
    }));
}

function getAppHtml() {
    var k = 0;
    return RDS.renderToStaticMarkup(R.DOM.html(
        null,
        R.DOM.head(
            null,
            R.DOM.title(null, 'Berlin Food'),
            R.DOM.meta({
                name: 'viewport',
                content: 'width=device-width, initial-scale=1, user-scalable=no'
            }),
            R.DOM.link({
                rel: 'stylesheet',
                href: '//api.tiles.mapbox.com/mapbox-gl-js/v0.12.2/mapbox-gl.css'
            }),
            //becouse we load css and js together we have to put it into the head
            //TODO: decouple js and css
            program.export ?
            //prod
            [
                null,
                R.DOM.script({
                    key: k++,
                    src: '//api.tiles.mapbox.com/mapbox-gl-js/v0.12.2/mapbox-gl.js'
                }),
                R.DOM.script({
                    key: k++,
                    dangerouslySetInnerHTML: {
                        __html: 'mapboxgl.accessToken = \'' + MAP_BOX_TOKEN + '\';'
                    }
                }),
                R.DOM.script({
                    key: k++,
                    src: 'https://fb.me/react-0.14.3.min.js'
                }),
                R.DOM.script({
                    key: k++,
                    src: 'https://fb.me/react-dom-0.14.3.min.js'
                }),
                R.DOM.script({
                    key: k++,
                    src: './map-gl-page.js?' + packagejson.version
                }),
                //google analytics
                R.DOM.script({
                    key: k++,
                    dangerouslySetInnerHTML: {
                        __html: '(function(i,s,o,g,r,a,m){i[\'GoogleAnalyticsObject\']=r;i[r]=i[r]||function(){  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)  })(window,document,\'script\',\'//www.google-analytics.com/analytics.js\',\'ga\');  ga(\'create\', \'UA-74155131-1\', \'auto\');  ga(\'send\', \'pageview\');'
                    }
                })

            ] :
            //dev
            [
                R.DOM.script({
                    key: k++,
                    src: '//api.tiles.mapbox.com/mapbox-gl-js/v0.12.2/mapbox-gl.js'
                }),
                R.DOM.script({
                    key: k++,
                    dangerouslySetInnerHTML: {
                        __html: 'mapboxgl.accessToken = \'' + MAP_BOX_TOKEN + '\';'
                    }
                }),
                R.DOM.script({
                    key: k++
                }, 'window.__DEV__ = true;'),
                R.DOM.script({
                    key: k++,
                    src: 'https://fb.me/react-0.14.3.js'
                }),
                R.DOM.script({
                    key: k++,
                    src: 'https://fb.me/react-dom-0.14.3.js'
                }),
                R.DOM.script({
                    src: '/components/map-gl-page.js'
                })
            ]
        ),
        //TODO: put panel here to avoid flipping
        R.DOM.body(null, '')
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
