/**
 * add venues layer
 * @module venues
 */
'use strict';

var request = require('browser-request');
var clusterColor = require('./../../lib/cluster-color');
var getMinZoomLevel = require('./min-zoom-level');
var chroma = require('chroma-js');
var scale = require('d3-scale');
var _ = require('lodash');
//TODO: reuse
var getRadius = scale.scalePow()
    .exponent(3)
    .domain([1, 9])
    .range([1, 25]);

var getBrightnes = scale.scaleLinear()
    .domain([1, 6, 7, 9])
    .range([1, 1, 0, 0]);


/**
 * @var {Promise.<FeatureCollection>}
 */
var venuesPromise = new Promise(function (resolve, reject) {
    request('/geojson/processed.venues.json', function (err, res, body) {
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
    Promise.all([venuesPromise, mapPromise]).then(function (result) {
        var venuePoints = result[0].features;
        var map = result[1];
        map.addSource('venues', {
            type: 'geojson',
            data: result[0]
        });
        var venueClasses = _.groupBy(venuePoints, function (p) {
            var props = p.properties;
            var venue = props.venue;
            var rating = Number(((venue.rating || 5)).toFixed(1));
            var color = clusterColor(props.clusterId);
            var radius = Math.floor(getRadius(rating));
            var brightnes = getBrightnes(rating);
            if (brightnes) {
                color = chroma(color).brighten(brightnes).css()
            }
            var minzoom = Math.floor(getMinZoomLevel(props.clusterRating));
            if (minzoom < 13) {
                minzoom = 13;
            }
            return [
                color,
                radius,
                minzoom
            ].join('&');
        });
        map.batch(function (batch) {
            _.forIn(venueClasses, function (points, classStr) {
                var classAr = classStr.split('&');
                var venueIds = points.map(function (p) {
                    return p.properties.venueId;
                });
                var radius = Number(classAr[1]);
                batch.addLayer({
                    id: ['venue'].concat(classAr).join('-'),
                    source: 'venues',
                    type: 'circle',
                    minzoom: Number(classAr[2]),
                    paint: {
                        'circle-color': classAr[0],
                        'circle-radius': {
                            stops: [[13, 3], [14, 3],  [17, radius], [20, radius]]
                        }
                    },
                    filter: ['in', 'venueId'].concat(venueIds)
                });
            });
        });
    });

}
