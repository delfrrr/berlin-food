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
var CLASS_SEPARATOR = '&';
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

        clusterPoints.filter(function (cp) {
            return cp.properties.radius;
        });

        var clusterClasses = _.groupBy(clusterPoints, function (cp) {
            var clusterId = cp.properties.clusterId;
            var minzoom = Math.floor(getMinZoomLevel(cp.properties.clusterRating));
            var color = chroma(clusterColor(clusterId)).brighten(1).css();
            var radius = Number(cp.properties.radius.toFixed(3));
            return [
                color,
                radius,
                minzoom
            ].join(CLASS_SEPARATOR);
        });

        map.batch(function (batch) {
            _.forIn(clusterClasses, function (points, classStr) {
                var classAr = classStr.split(CLASS_SEPARATOR);
                var radius = Number(classAr[1]);
                var minzoom = Number(classAr[2]);
                var color = classAr[0];
                var clusterIds = points.map(function (cp) {
                    return cp.properties.clusterId;
                });
                batch.addLayer({
                    id: 'cluster-' + classStr,
                    source: 'clusters',
                    type: 'circle',
                    minzoom: minzoom,
                    paint: {
                        'circle-color': color,
                        'circle-opacity': {
                            stops: [[1, 0.8], [14, 0.8], [17, 0.3], [19, 0]]
                        },
                        'circle-blur': {
                            base: 1,
                            stops: distanceZoomScale.map(function (stop) {
                                return [stop[0], 1 / stop[1] / radius]
                            })
                        },
                        'circle-radius': {
                            base: 2,
                            stops: distanceZoomScale.map(function (stop) {
                                return[stop[0], stop[1] * radius]
                            })
                        }
                    },
                    filter: ['in', 'clusterId'].concat(clusterIds)
                }, 'housenum-label');
            });
        });
    });

}
