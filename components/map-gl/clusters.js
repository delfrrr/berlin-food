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
var scale = require('d3-scale');
var mapboxgl  = require('mapboxgl');
var getOpacity = scale.scaleLinear().domain([1, 14, 17, 19]).range([0.8, 0.8, 0.3, 0]);
var eventTarget = require('./event-target');
var viewModel = require('../../lib/view-model');
var CLASS_SEPARATOR = '&';
var MAX_ZOOM = 15;
var MIN_HIGHLIGHT_OPACITY = 0.4;
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
    return _.range(1, 21).map(function (zoom) {
        return [zoom, pixelToKm * Math.pow(2, zoom)];
    });
}

/**
 * @var {Promise.<FeatureCollection>}
 */
var clusersPromise = new Promise(function (resolve, reject) {
    request('./geojson/processed.clusters.json', function (err, res, body) {
        if (err) {
            reject(err);
        } else {
            resolve(JSON.parse(body));
        }
    });
});

/**
 * add layers by class on map
 * @param {mapboxgl.Batch} batch
 * @param {Object.<ClassString, Points>} clusterClasses
 * @param {Array.<Array.<zoom, pixelToKm>>}
 */
function addLayers(batch, clusterClasses, distanceZoomScale) {
    _.forIn(clusterClasses, function (points, classStr) {
        var classAr = classStr.split(CLASS_SEPARATOR);
        var radius = Number(classAr[1]);
        var minzoom = Number(classAr[2]);
        var color = classAr[0];
        var clusterIds = points.map(function (cp) {
            return cp.properties.clusterId;
        });
        points.forEach(function (p) {
            p.properties.lngLat = new mapboxgl.LngLat(
                p.geometry.coordinates[0],
                p.geometry.coordinates[1]
            );
        });
        batch.addLayer({
            id: 'cluster-' + classStr,
            interactive: true,
            source: 'clusters',
            type: 'circle',
            minzoom: minzoom - 1,
            paint: {
                'circle-color': color,
                'circle-opacity': {
                    //TODO use only zoom elevels from domain
                    stops: _.range(1, 20).map(function (z) {
                        if (z < minzoom) {
                            return [z, 0]
                        } else {
                            return [z, getOpacity(z)]
                        }
                    })
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
}

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

        var MAX_RADIUS = Math.max.apply(Math, clusterPoints.map(function (cp) {
            return cp.properties.radius;
        }));

        var clusterClasses = _.groupBy(clusterPoints, function (cp) {
            var minzoom = Math.floor(getMinZoomLevel(cp.properties.clusterRating));
            var color = chroma(clusterColor(cp.properties.clusterSize)).brighten(1).css();
            var radius = Number(cp.properties.radius.toFixed(3));
            return [
                color,
                radius,
                minzoom
            ].join(CLASS_SEPARATOR);
        });

        map.batch(function (batch) {
            addLayers(batch, clusterClasses, distanceZoomScale);
        });

        map.on('move', function () {
            viewModel.set({
                selectedClusterTarget: null,
                selectedClusterPosition: null
            });
        });

        map.on('mousemove', function (e) {
            var zoom = map.getZoom();
            if (zoom >= MAX_ZOOM) {
                return;
            }
            map.featuresAt(e.point, {
                radius: distanceZoomScale[Math.ceil(zoom) - 1][1] * MAX_RADIUS
            }, function (err, features) {
                var targetObject = eventTarget(e, features, map, /^cluster/);
                if (
                    targetObject &&
                    targetObject.layer.minzoom <= zoom &&
                    targetObject.layer.paint['circle-opacity'] > MIN_HIGHLIGHT_OPACITY
                ) {
                    viewModel.set({
                        selectedClusterTarget: targetObject,
                        selectedClusterPosition: map.project(targetObject.properties.lngLat)
                    });
                }
            });
        });
    });
}
