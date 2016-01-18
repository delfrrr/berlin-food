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
var CLASS_SEPARATOR = '&';
var LABEL_SIZE = 12;
var MIN_LABEL_RATING = 7;
//TODO: reuse
var getRadius = scale.scalePow()
    .exponent(3)
    .domain([1, 9])
    .range([1, 25]);

var getBrightnes = scale.scaleLinear()
    .domain([1, 6, 7, 9])
    .range([1, 1, 0, 0]);

function getRating(venue) {
    return Number(((venue.rating || 5)).toFixed(1));
}

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
            var rating = getRating(venue);
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
            ].join(CLASS_SEPARATOR);
        });
        var vanueLabelClasses = _.groupBy(venuePoints.filter(function (p) {
            return p.properties.venue.rating >= MIN_LABEL_RATING;
        }), function (p) {
            var rating = getRating(p.properties.venue);
            var radius = Math.floor(getRadius(rating));
            return [
                radius
            ].join(CLASS_SEPARATOR);
        });
        map.batch(function (batch) {
            //Circles
            _.forIn(venueClasses, function (points, classStr) {
                var classAr = classStr.split(CLASS_SEPARATOR);
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
                }, 'rail-label');
            });
            //Labels
            _.forIn(vanueLabelClasses, function (points, classStr) {
                var classAr = classStr.split(CLASS_SEPARATOR);
                var radius = Number(classAr[0]);
                var venueIds = points.map(function (p) {
                    return p.properties.venueId;
                });
                batch.addLayer({
                    id: 'venues-labels-' + classStr,
                    source: 'venues',
                    type: 'symbol',
                    minzoom: 14,
                    layout: {
                        'text-field': '{name}',
                        'text-anchor': 'top',
                        'text-size': LABEL_SIZE,
                        'text-offset': [0, radius / LABEL_SIZE],
                        'text-ignore-placement': true,
                        'text-optional': false
                    },
                    paint: {
                        'text-opacity': {
                            stops: [[14, 0], [17, 0], [17.1, 1]]
                        },
                        'text-color': '#65513d',
                        'text-halo-color': '#ffffff',
                        'text-halo-width': 1
                    },
                    filter: ['in', 'venueId'].concat(venueIds)
                });
            });
        });
    });

}
