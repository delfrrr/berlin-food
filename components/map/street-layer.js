/**
 * @module street-layer
 */

'use strict';

var L = require('mapbox');
var superClass = new L.mapbox.FeatureLayer();
var clusterColor = require('./cluster-color');
var chroma = require('chroma-js');

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
            var color = chroma(
                clusterColor(feature.properties.clusterId)
            ).brighten(1).css();
            return {
                color: color,
                weight: 2,
                clickable: false,
                opacity: 1
            }
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
        if (zoom > 15) {
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
