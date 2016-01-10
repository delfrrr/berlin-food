/**
 * @module components/map/cluster-layer
 */

'use strict';

var L = require('mapbox');
var scale = require('d3-scale');
var chroma = require('chroma-js');
var rbush = require('rbush');

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
        this.on('ready', function () {
            var clusterPoints = this.getGeoJSON().features;
            this._tree = rbush(
                clusterPoints.length,
                [
                    '.properties.bbox[0]',
                    '.properties.bbox[1]',
                    '.properties.bbox[2]',
                    '.properties.bbox[3]'
                ]
            );
            this._tree.load(clusterPoints);
        }, this);
    },

    /**
     * @returns {ClusterId[]}
     */
    getVisibleClusters: function () {
        if (this._tree && this._map) {
            //TODO: avaoid duplication
            var zoom = this._map.getZoom();
            var size = clusterSize(zoom);
            var bbox = this._map.getBounds().toBBoxString().split(',').map(Number);
            return this._tree.search(bbox).filter(function (feature) {
                return feature.properties.clusterSize > size;
            }).map(function (feature) {
                return feature.properties.clusterId;
            });
        } else {
            return [];
        }
    },

    _updateForZoom: function () {
        var zoom = this._map.getZoom();
        var size = clusterSize(zoom);
        this.setStyle();
        this.setFilter(function (feature) {
            return feature.properties.clusterSize> size;
        });
    }
});

module.exports = Layer;
