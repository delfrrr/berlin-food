/**
 * @module components/map
 */

'strict mode';

var React = require('react');
// var _  = require('lodash');
var L = require('mapbox');
// var classnames = require('classnames');
//TODO: replace with d3 scale
var chroma = require('chroma-js');
var scale = require('d3-scale');

/**
 * @type {function}
 * @param {Number} zoom
 * @param {Number} fillOpacity
 */
var clusterOpacity = scale.scaleLinear().domain([1, 14, 19]).range([0.8, 0.8, 0.3]);

/**
 * @type {Function}
 * @param {Number} zoom
 * @return {Number} min number of venues
 */
var minNumberOfVenues = scale.scaleLinear().domain([1, 19]).range([10,  1]);

var COLORS = chroma.cubehelix().lightness([0.3, 0.5]).scale().colors(20);

/**
 * @param {ClusterId} clusterId
 * @return {Color}
 */
function getColorForCluster(clusterId) {
    return COLORS[clusterId % COLORS.length];
}

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
        var component = this;

        /**
         * filters clusters
         * @param {Point} feature
         * @param {Boolean} is shown
         */
        var filter = function (feature) {
            var zoom = component._map.getZoom();
            return feature.properties.venuesCount > minNumberOfVenues(zoom);
        }
        var clustersLayer = L.mapbox.featureLayer('/geojson/processed.clusters.json', {
            style: function (feature) {
                var zoom = component._map.getZoom();
                var color = chroma(getColorForCluster(feature.properties.clusterId)).brighten(1).css();
                return {
                    fillColor: color,
                    stroke: false,
                    fill: true,
                    fillOpacity: clusterOpacity(zoom)
                }
            },
            pointToLayer: function (feature, latLng) {
                return new L.Circle(latLng, feature.properties.radius * 1000);
            },
            filter: filter
        });
        this._map.on('zoomend', function () {
            var zoom = component._map.getZoom();
            clustersLayer.setStyle({
                fillOpacity: clusterOpacity(zoom)
            });
            clustersLayer.setFilter(filter);
        });
        this._map.addLayer(clustersLayer);
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
