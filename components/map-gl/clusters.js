/**
 * add cluster layers
 * @module clusters
 */
'use strict';

var request = require('browser-request');
var chroma = require('chroma-js');
var _ = require('lodash');
var clusterColor = require('./../../lib/cluster-color');
var getMinZoomLevel = require('./min-zoom-level');
var R = 6371;//km

/**
 * @param {mapboxgl.Map} map
 * @return {Array.<Array.<zoom, pixelToKm>>}
 */
function getDistanceZoomScale(map) {
    var zoom = map.getZoom();
    var center = map.getCenter().toArray();
    //in mercantor projection distanced strached by OY, so we use bigger radius
    var dy = 0.01;
    var p0 = map.project(center);
    var p1 = map.project([center[0], center[1] + dy]);
    var pixelToDeg = Math.abs((p1.y - p0.y)) / dy;
    var pixelToKm = pixelToDeg * 180 / Math.PI / R  /
        Math.pow(2, zoom) /
        Math.cos(center[0] / 180 * Math.PI);
    return _.range(1, 20).map(function (zoom) {
        return [zoom, pixelToKm * Math.pow(2, zoom)];
    });
}

/**
 * @var {Promise.<FeatureCollection>}
 */
var clusersPromise = new Promise(function (resolve, reject) {
    request('/geojson/processed.clusters.json', function (err, res, body) {
        if (err) {
            reject(err);
        } else {
            resolve(JSON.parse(body));
        }
    });
});

module.exports = function (mapPromise) {
    Promise.all([clusersPromise, mapPromise]).then(function (result) {
        var clusterPoints = result[0].features;
        var map = result[1];
        var distanceZoomScale = getDistanceZoomScale(map);
        map.addSource('clusters', {
            type: 'geojson',
            data: result[0]
        });

        map.batch(function (batch) {
            clusterPoints.forEach(function (cp) {
                var clusterId = cp.properties.clusterId;
                if (cp.properties.radius) {
                    batch.addLayer({
                        id: 'cluster-' + clusterId,
                        source: 'clusters',
                        type: 'circle',
                        minzoom: getMinZoomLevel(cp.properties.clusterRating),
                        paint: {
                            'circle-color': chroma(clusterColor(clusterId)).brighten(1).css(),
                            'circle-opacity': {
                                stops: [[1, 0.8], [14, 0.8], [17, 0.3], [19, 0]]
                            },
                            'circle-blur': {
                                base: 1,
                                stops: distanceZoomScale.map(function (stop) {
                                    return [stop[0], 1 / stop[1] / cp.properties.radius]
                                })
                            },
                            'circle-radius': {
                                base: 2,
                                stops: distanceZoomScale.map(function (stop) {
                                    return[stop[0], stop[1] * cp.properties.radius]
                                })
                            }
                        },
                        filter: ['==', 'clusterId', clusterId]
                    }, 'housenum-label');
                }
            });
        });
    });

}
