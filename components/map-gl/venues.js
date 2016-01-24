/**
 * add venues layer
 * @module venues
 */
'use strict';

var request = require('browser-request');
var clusterColor = require('./../../lib/cluster-color');
var getMinZoomLevel = require('./min-zoom-level');
var chroma = require('chroma-js');
var mapboxgl  = require('mapboxgl');
var scale = require('d3-scale');
var viewModel = require('../../lib/view-model');
var _ = require('lodash');
var CLASS_SEPARATOR = '&';
var LABEL_SIZE = 12;
var MIN_LABEL_RATING = 6;

/**
 * @type {function}
 * @param {Venue.rating}
 * @return {Number} circle max radius px
 */
var getRadius = scale.scalePow()
    .exponent(3)
    .domain([1, 9])
    .range([1, 25]);

/**
 * @type {function}
 * @param {Venue.rating}
 * @return {Number} Chroma brighten parameter
 */
var getBrightnes = scale.scaleLinear()
    .domain([1, 6, 7, 9])
    .range([1, 1, 0, 0]);

/**
 * @param {Venue} venue
 * @return {Venue.rating}
 */
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
 * @param {mapboxgl.Point} p1
 * @param {mapboxgl.Point} p2
 * @return {Number} pixel distance
 */
function pointDistance(p1, p2) {
    var dx = p1.x - p2.x;
    var dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLCanvasElement} canvas
 */
function drawHover(ctx, canvas, map) {
    var venueTarget = viewModel.get('selectedVenueTarget');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (venueTarget) {
        var point = map.project(venueTarget.properties.lngLat);
        ctx.beginPath();
        ctx.arc(
            point.x,
            point.y,
            venueTarget.layer.paint['circle-radius'],
            0, 2 * Math.PI, false
        );
        ctx.fillStyle = chroma.gl.apply(chroma, venueTarget.layer.paint['circle-color']).darken(1).css();
        ctx.fill();
    }
}

/**
 * @param {Point[]} venuePoints
 * @return {Object.<String, Point[]>} point classes
 */
function getVenueCircleClasses(venuePoints) {
    return _.groupBy(venuePoints, function (p) {
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
}

/**
 * @param {Point[]} venuePoints
 * @return {Object.<String, Point[]>} point classes
 */
function getVenueLabelClasses(venuePoints) {
    return _.groupBy(venuePoints, function (p) {
        var rating = getRating(p.properties.venue);
        var radius = Math.floor(getRadius(rating));
        return [
            radius
        ].join(CLASS_SEPARATOR);
    });
}

/**
 * @param {mapboxgl.Map.Batch} batch
 * @param {Object.<String, Point[]>} classes
 */
function addCircleClasses(batch, classes) {
    _.forIn(classes, function (points, classStr) {
        var classAr = classStr.split(CLASS_SEPARATOR);
        var venueIds = points.map(function (p) {
            return p.properties.venueId;
        });
        var radius = Number(classAr[1]);
        var id = ['venue-circle'].concat(classAr).join('-');
        var filter = ['in', 'venueId'].concat(venueIds);
        var layer = {
            source: 'venues',
            type: 'circle',
            minzoom: Number(classAr[2]),
            paint: {
                'circle-radius': {
                    stops: [[13, 3], [14, 3],  [17, radius], [20, radius]]
                }
            }
        };
        //visible layer
        batch.addLayer(_.defaultsDeep({}, layer, {
            id: id,
            filter: filter,
            interactive: true,
            paint: {
                'circle-color': classAr[0]
            }
        }), 'rail-label');
        //selection layer
        batch.addLayer(_.defaultsDeep({}, layer, {
            id: 'select-' + id,
            filter: ['in', 'venueId', 'none'],
            paint: {
                'circle-color': chroma(classAr[0]).darken(1).css()
            }
        }), 'rail-label');
    });
}

/**
 * @param {mapboxgl.Map.Batch} batch
 * @param {Object.<String, Point[]>} classes
 */
function addLabelClasses(batch, classes) {
    _.forIn(classes, function (points, classStr) {
        var classAr = classStr.split(CLASS_SEPARATOR);
        var radius = Number(classAr[0]);
        var venueIds = [];
        points.forEach(function (p) {
            venueIds.push(p.properties.venueId);
            p.properties.lngLat = new mapboxgl.LngLat(
                p.geometry.coordinates[0],
                p.geometry.coordinates[1]
            );
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
}

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
        var venueClasses = getVenueCircleClasses(venuePoints);
        var vanueLabelClasses = getVenueLabelClasses(venuePoints.filter(function (p) {
            return p.properties.venue.rating >= MIN_LABEL_RATING;
        }));
        map.batch(function (batch) {
            addCircleClasses(batch, venueClasses);
            addLabelClasses(batch, vanueLabelClasses);
        });
        var canvas = map.getCanvas().cloneNode();
        map.getCanvasContainer().appendChild(canvas);
        var ctx = canvas.getContext('2d');
        viewModel.on('change:selectedVenueTarget', function () {
            drawHover(ctx, canvas, map);
        });
        map.on('move', function () {
            drawHover(ctx, canvas, map);
        });
        map.on('mousemove', function (e) {
            map.featuresAt(e.point, {
                radius: 25
            }, function (err, features) {
                var targetObjects;
                if (features &&
                    features.length &&
                    (targetObjects = features.filter(function (f) {
                        return (
                            f.layer.id.match(/^venue-circle/) &&
                            f.properties.lngLat &&
                            (
                                pointDistance(
                                    map.project(f.properties.lngLat),
                                    e.point
                                ) <= f.layer.paint['circle-radius']
                            )
                        );
                    })).length
                ) {
                    viewModel.set('selectedVenueTarget', targetObjects[0]);
                } else {
                    viewModel.set('selectedVenueTarget', null);
                }
            });
        });
    });

}
