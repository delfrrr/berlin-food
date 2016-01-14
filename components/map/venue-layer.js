/**
 * @module components/map/venue-layer
 */

'use strict';

var L = require('mapbox');
var scale = require('d3-scale');
var turf  = require('turf');
var getRadius = scale.scalePow()
    .exponent(3)
    .domain([1, 9])
    .range([1, 25]);
var superClass = new L.mapbox.FeatureLayer();
var clusterColor = require('./../../lib/cluster-color');

/**
 * @type {Model}
 */
var viewModel = require('./view-model');

/**
 * @return {Boolean}
 */
var falseFilter = function () {
    return false;
}

var R = 6371 * 1000;//m
var DEG_RAD = Math.PI / 180;

//will bi calculated on first iteration
var LAT_COS;

//calc sin and cos
var HEXAGON_COSINES = [];
var HEXAGON_SINES = [];
(function () {
    var i, angle;
    for (i = 0; i < 6; i++) {
        angle = 2 * Math.PI/6 * i;
        HEXAGON_COSINES.push(Math.cos(angle));
        HEXAGON_SINES.push(Math.sin(angle));
    }
}());


/**
 * @param {Array} center - x,y
 * @param {Number} radius - meters
 * @return {Polygon}
 */
function hexagon(center, radius) {
    if (!LAT_COS) {
        LAT_COS = Math.cos(center[1] * DEG_RAD);
    }
    var vertices = [];
    var rx = radius / DEG_RAD / LAT_COS / R;
    var ry = radius / DEG_RAD / R;
    for (var i = 0; i < 6; i++) {
        var x = center[0] + rx * HEXAGON_COSINES[i];
        var y = center[1] + ry * HEXAGON_SINES[i];
        vertices.push([x,y]);
    }
    vertices.push(vertices[0]);
    return turf.polygon([vertices]);
}

/**
 * @class
 * @extends L.mapbox.FeatureLayer
 */
var Layer = L.mapbox.FeatureLayer.extend({

    options: {
        style: function (feature) {
            var color = clusterColor(feature.properties.clusterId);
            return {
                fillColor: color,
                stroke: true,
                weight: 1,
                color: '#ffffff',
                opacity: 0.1,
                fill: true,
                fillOpacity: 1,
                clickable: false
            }
        },
        pointToLayer: function (feature) {
            var venue = feature.properties.venue;
            var rating = venue.rating || 5;
            var polygon = hexagon(feature.geometry.coordinates, getRadius(rating));
            return L.GeoJSON.geometryToLayer(polygon);
        },
        filter: falseFilter
    },

    /**
     * @override
     */
    onAdd: function (map) {
        superClass.onAdd.call(this, map);
        this.on('ready', function () {
            viewModel.on('change:visibileClusters', this._updateFilter, this);
            this._updateFilter();
        }, this);
    },

    _updateFilter: function () {
        var zoom = this._map.getZoom();
        if (zoom > 13) {
            var visibileClusters = viewModel.get('visibileClusters');
            this.setFilter(this._filter.bind(this, visibileClusters.reduce(function (visibileClusters, id) {
                visibileClusters[id] = true;
                return visibileClusters;
            }, {})));
        } else if (this.getFilter() !== falseFilter) {
            this.setFilter(falseFilter);
        }
    },

    /**
     * @param {Object.<ClusterId, Boolean>} clustersHash
     * @param {Point} feature
     * @return {Booleam}
     */
    _filter: function (clustersHash, feature) {
        return clustersHash[feature.properties.clusterId];
    }

});

module.exports = Layer;
