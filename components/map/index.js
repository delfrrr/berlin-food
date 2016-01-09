/**
 * @module components/map
 */

'use strict';

var React = require('react');
var L = require('mapbox');
var ClusterLayer = require('./cluster-layer');

require('./index.less');

module.exports = React.createFactory(React.createClass({
    componentDidMount: function () {
        var component = this;
        var zoom = Number(localStorage.getItem('zoom'));
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

    _initLayers: function () {
        this._map.addLayer(new ClusterLayer('/geojson/processed.clusters.json'));
    },

    _onMapChange: function () {
        var center = this._map.getCenter();
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
