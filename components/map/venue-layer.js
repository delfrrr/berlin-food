/**
 * @module components/map/venue-layer
 */

'use strict';

var L = require('mapbox');
var scale = require('d3-scale');
var getRadius = scale.scaleLinear().domain([0, 5, 8, 10]).range([2, 3, 10, 15]);
var superClass = new L.mapbox.FeatureLayer();
var clusterColor = require('./cluster-color');
var Model = require('backbone-model').Model;

/**
 * @type {Model}
 */
var viewModel = new Model({
    visible: false
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

            return new L.CircleMarker(latLng, {
                radius: getRadius(rating)
            });
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
        viewModel.on('change:visible', function (m, visible) {
            if (visible) {
                this.setFilter(function () {
                    return true;
                });
            } else {
                this.setFilter(function () {
                    return false;
                });
            }
        }, this);
        this._updateForZoom(map);
    },


    _updateForZoom: function (map) {
        var zoom = map.getZoom();
        if (zoom > 14) {
            viewModel.set('visible', true);
        } else {
            viewModel.set('visible', false);
        }
        this.bringToFront();
    }
});

module.exports = Layer;
