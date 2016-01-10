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

/**
 * @type {Model}
 */
var viewModel = require('./view-model');

var falseFilter = function () {
    return false;
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
