/**
 * add streets layer
 * @module streets
 */
'use strict';

var request = require('browser-request');
var clusterColor = require('./../../lib/cluster-color');
var chroma = require('chroma-js');
var _ = require('lodash');
var CLASS_SEPARATOR = '&';


/**
 * @var {Promise.<FeatureCollection>}
 */
var streetsPromise = new Promise(function (resolve, reject) {
    request('./geojson/processed.streets.json', function (err, res, body) {
        if (err) {
            reject(err);
        } else {
            resolve(JSON.parse(body));
        }
    });
});

/**
 * @param {Promise.<mapboxgl.Map>} mapPromise
 */
module.exports = function (mapPromise) {
    Promise.all([streetsPromise, mapPromise]).then(function (result) {
        var lines = result[0].features;
        var map = result[1];
        map.addSource('streets', {
            type: 'geojson',
            data: result[0]
        });
        var classes = _.groupBy(lines, function (line) {
            var color = chroma(clusterColor(line.properties.clusterId))
                .brighten(1)
                .css();
            return [
                color
            ].join(CLASS_SEPARATOR);
        });
        map.batch(function (batch) {
            _.forIn(classes, function (lines, classStr) {
                var classAr = classStr.split(CLASS_SEPARATOR);
                var color = classAr[0];
                var ids = lines.map(function (l) {
                    return l.properties.streetId;
                });
                batch.addLayer({
                    id: ['street'].concat(classAr).join('-'),
                    source: 'streets',
                    type: 'line',
                    minzoom: 14,
                    paint: {
                        'line-color': color,
                        'line-width': 2
                    },
                    filter: ['in', 'streetId'].concat(ids)
                }, 'contour-index-label');
            })
        });
    });

}
