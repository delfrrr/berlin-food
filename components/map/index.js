/**
 * @module components/map
 */

'use strict';

var React = require('react');
var L = require('mapbox');
var ClusterLayer = require('./cluster-layer');
var VenueLayer = require('./venue-layer');
var StreetLayer = require('./street-layer');
var viewModel = require('./view-model');

require('./index.less');

module.exports = React.createFactory(React.createClass({
    componentDidMount: function () {
        var component = this;
        var zoom = Math.floor(Number(localStorage.getItem('zoom')));
        var center = [
            Number(localStorage.getItem('lat')),
            Number(localStorage.getItem('lng'))
        ];
        this._map = L.mapbox.map(component.refs.mapNode, 'mapbox.streets-basic');
        if (zoom) {
            this._map.setView(center, zoom);
        }
        this._map.on('moveend', this._onMapChange);
        this._map.on('zoomend', this._onMapChange);
        this._initLayers();
    },

    _updateVisibleClusters: function () {
        var clusterIds = this._clusterLayer.getVisibleClusters();
        viewModel.set('visibileClusters', clusterIds);
    },

    _initLayers: function () {
        this._clusterLayer = new ClusterLayer('/geojson/processed.clusters.json');
        this._clusterLayer.on('ready', function () {
            this._updateVisibleClusters();
            this._map.on('moveend', this._updateVisibleClusters, this);
        }, this);
        var venueLayer = new VenueLayer('/geojson/processed.venues.json');
        var streetLayer = new StreetLayer('/geojson/processed.streets.json');
        this._map.addLayer(this._clusterLayer);
        this._map.addLayer(venueLayer);
        this._map.addLayer(streetLayer);
    },

    _onMapChange: function () {
        var center = this._map.getCenter();
        // console.log('zoom', this._map.getZoom());
        localStorage.setItem('zoom', this._map.getZoom());
        localStorage.setItem('lat', center.lat);
        localStorage.setItem('lng', center.lng);
    },

    render: function () {
        return React.DOM.div(
            {
                className: 'map'
            },
            React.DOM.div({
                className: 'map__map-node',
                ref: 'mapNode'
            })
        );
    }
}));
