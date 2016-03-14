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
var eventTarget = require('./event-target');
var _ = require('lodash');
var CLASS_SEPARATOR = '&';
var LABEL_SIZE = 12;
var MIN_LABEL_RATING = 6;
var MIN_ZOOM = 13;
var MIN_HIGHLIGHT_ZOOM = 15;

var getRadius = require('../../lib/venue-radius');

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

var ratingColorScale =  require('../../lib/rating-color-scale');

/**
 * @var {Promise.<FeatureCollection>}
 */
var venuesPromise = new Promise(function (resolve, reject) {
    request('./geojson/processed.venues.json', function (err, res, body) {
        if (err) {
            reject(err);
        } else {
            resolve(JSON.parse(body));
        }
    });
});

/**
 * @param {Point[]} venuePoints
 * @return {Object.<String, Point[]>} point classes
 */
function getVenueCircleClasses(venuePoints) {
    return _.groupBy(venuePoints, function (p) {
        var props = p.properties;
        var venue = props.venue;
        var rating = getRating(venue);
        var color2 = ratingColorScale(rating);
        var color = clusterColor(props.clusterSize);
        var radius = Math.floor(getRadius(rating));
        var brightnes = getBrightnes(rating);
        if (brightnes) {
            color2 = color2.brighten(brightnes).css()
        } else {
            color2 = color2.darken(1).css()
        }
        var minzoom = Math.floor(getMinZoomLevel(props.clusterRating));
        if (minzoom < MIN_ZOOM) {
            minzoom = MIN_ZOOM;
        }
        return [
            color,
            radius,
            minzoom,
            color2
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
                    stops: [[14, 3],  [16, radius], [20, radius]]
                }
            }
        };
        //visible layer
        batch.addLayer(_.defaultsDeep({}, layer, {
            id: id,
            filter: filter,
            interactive: true,
            paint: {
                'circle-color': {
                    stops: [[15.9, classAr[0]],  [16, classAr[3]]]
                }
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
        var goodVenues = [];
        /**
         * @type {Object.<ClusterId, Point[]>}
         */
        var venuesByClusterId = {};
        venuePoints.forEach(function (p) {
            if (p.properties.venue.rating >= MIN_LABEL_RATING) {
                goodVenues.push(p);
            }
            var clusterId = p.properties.clusterId;
            if (!venuesByClusterId[clusterId]) {
                venuesByClusterId[clusterId] = [];
            }
            venuesByClusterId[clusterId].push(p);
        });
        viewModel.set('venuesByClusterId', venuesByClusterId);
        var vanueLabelClasses = getVenueLabelClasses(goodVenues);

        //set max user count
        viewModel.set('maxUserCount', Math.max.apply(Math, goodVenues.map(function (p) {
            return p.properties.venue.stats.usersCount;
        })));
        map.batch(function (batch) {
            addCircleClasses(batch, venueClasses);
            addLabelClasses(batch, vanueLabelClasses);
        });
        map.on('move', function () {
            viewModel.set('selectedVenueTarget', null);
        });
        map.on('mousemove', function (e) {
            var zoom = map.getZoom();
            if (zoom >= MIN_HIGHLIGHT_ZOOM) {
                map.featuresAt(e.point, {
                    radius: 25
                }, function (err, features) {
                    var targetObject = eventTarget(e, features, map, /^venue-circle/);
                    if (targetObject) {
                        viewModel.set({
                            selectedVenueTarget: targetObject,
                            selectedVenuePosition: map.project(targetObject.properties.lngLat)
                        });
                    }
                });
            }
        });
    });

}
