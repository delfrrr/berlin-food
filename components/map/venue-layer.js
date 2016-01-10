/**
 * @module components/map/venue-layer
 */

'use strict';

var L = require('mapbox');
var scale = require('d3-scale');
var getRadius = scale.scalePow()
    .exponent(3)
    .domain([1, 9])
    .range([1, 25]);
var superClass = new L.mapbox.FeatureLayer();
var clusterColor = require('./cluster-color');
var clusterSize = require('./min-cluster-size');
var Model = require('backbone-model').Model;

/**
 * @type {Model}
 */
var viewModel = new Model({
    minClusterSize: +Infinity
});


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
                stroke: false,
                fill: true,
                fillOpacity: 1
            }
        },
        pointToLayer: function (feature, latLng) {
            var venue = feature.properties.venue;
            var rating = venue.rating || 5;

            return new L.Circle(latLng, getRadius(rating));
        },
        filter: function () {
            return false;
        }
    },

    /**
     * @override
     */
    onAdd: function (map) {
        superClass.onAdd.call(this, map);
        map.on('zoomend', function () {
            this._updateForZoom(map);
        }, this);
        viewModel.on('change:minClusterSize', function () {
            this.setFilter(this._filter);
        }, this);
        this._updateForZoom(map);
    },

    /**
     * @param {Point} feature
     * @return {Booleam}
     */
    _filter: function (feature) {
        return feature.properties.clusterSize > viewModel.get('minClusterSize');
    },


    _updateForZoom: function (map) {
        var zoom = map.getZoom();
        if (zoom > 12) {
            viewModel.set('minClusterSize', clusterSize(zoom));
        } else {
            viewModel.set('minClusterSize', +Infinity);
        }
        this.bringToFront();
    }
});

module.exports = Layer;
