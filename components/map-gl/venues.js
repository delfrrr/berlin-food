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
        map.batch(function (batch) {
            venuePoints.forEach(function (p, k) {
                var props = p.properties;
                var venue = props.venue;
                var minzoom = getMinZoomLevel(props.clusterRating);
                if (minzoom < 12) {
                    minzoom = 12;
                }
                var rating = venue.rating || 5;
                var color = clusterColor(props.clusterId);
                var radius = getRadius(rating);
                var brightnes = getBrightnes(rating);

                if (brightnes) {
                    color = chroma(color).brighten(brightnes).css()
                }

                batch.addLayer({
                    id: ['venue', venue.id, k].join('-'),
                    source: 'venues',
                    type: 'circle',
                    minzoom: minzoom,
                    paint: {
                        'circle-color': color,
                        'circle-radius': {
                            stops: [[13, 3], [14, 3],  [17, radius], [20, radius]]
                        }
                    },
                    filter: ['==', 'venueId', venue.id]
                });
            });
        });
    });

}
