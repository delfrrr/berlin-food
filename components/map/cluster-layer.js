/**
 * @module components/map/cluster-layer
 */

'use strict';

var L = require('mapbox');
var scale = require('d3-scale');
var chroma = require('chroma-js');

var superClass = new L.mapbox.FeatureLayer();
var clusterColor = require('./cluster-color');

/**
 * @type {function}
 * @param {Number} zoom
 * @param {Number} fillOpacity
 */
var clusterOpacity = scale.scaleLinear().domain([1, 14, 17, 19]).range([0.8, 0.8, 0.3, 0]);

var clusterSize = require('./min-cluster-size');

/**
 * @class
 * @extends L.mapbox.FeatureLayer
 */
var Layer = L.mapbox.FeatureLayer.extend({

    options: {
        style: function (feature) {
            var zoom = this._map.getZoom();
            var color = chroma(clusterColor(feature.properties.clusterId)).brighten(1).css();
            return {
                fillColor: color,
                stroke: false,
                fill: true,
                fillOpacity: clusterOpacity(zoom)
            }
        },
        pointToLayer: function (feature, latLng) {
            return new L.Circle(latLng, feature.properties.radius * 1000);
        }
    },

    /**
     * @override
     */
    onAdd: function (map) {
        superClass.onAdd.apply(this, arguments);
        this._updateForZoom();
        //TODO: unsubscribe from event
        map.on('zoomend', function () {
            this._updateForZoom();
        }, this);
    },

    /**
     * @override
     */
    initialize: function () {
        this.options.style = this.options.style.bind(this);
        superClass.initialize.apply(this, arguments);
    },

    _updateForZoom: function () {
        var zoom = this._map.getZoom();
        this.setStyle();
        this.setFilter(function (feature) {
            return feature.properties.clusterSize > clusterSize(zoom);
        });
    }
});

module.exports = Layer;
