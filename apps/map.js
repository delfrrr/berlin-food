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

program
    .version(packagejson.version)
    .option('-p, --port [number]', 'port', Number, 3000)
    .option('-s, --socket [string]', 'socket/ip', String, '127.0.0.1')
    .description('Express app showing map');
program.parse(process.argv);

app.use('/', function (req, res) {
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
            'zzz',
            R.DOM.script({
                src: '//api.mapbox.com/mapbox.js/v2.2.3/mapbox.js'
            }),
            R.DOM.script({
                dangerouslySetInnerHTML: {
                    __html: 'L.mapbox.accessToken = \'' + MAP_BOX_TOKEN + '\';'
                }
            })
            // R.DOM.script({}, 'window.__DEV__ = true;')
        )
    )));
});

app.listen(program.port, program.socket, function () {
    console.log('map started at %s:%j', program.socket, program.port);
});
