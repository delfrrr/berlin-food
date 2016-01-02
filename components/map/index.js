/**
 * @module components/map
 */

'strict mode';

var React = require('react');
var _  = require('lodash');
var L = require('mapbox');
var allVenues = require('../../geojson/all-venues.json');
var streetsData = require('../../geojson/streets.json');
var mapModel = require('./model');
var classnames = require('classnames');
var button = React.createFactory(require('elemental/lib/components/Button'));
var buttonGroup = React.createFactory(require('elemental/lib/components/ButtonGroup'));
var chroma = require('chroma-js');

require('elemental/less/elemental.less');
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
        this._layers = {
            allVenues: L.mapbox.featureLayer(allVenues),
            streets: this._createStreetLayer()
        }

        this._map.on('moveend', this._onMapChange);
        this._map.on('zoomend', this._onMapChange);
        mapModel.on('change', function () {
            //TODO: store model in state
            component.forceUpdate();
        });
        mapModel.on('change', _.debounce(function (e) {
            var changed = e.changed;
            _.forOwn(changed, function (value, key) {
                var layer = component._layers[key];
                var method = value ? 'addLayer' : 'removeLayer';
                if (layer) {
                    component._map.featureLayer[method](layer);
                }
            });
        }));
    },

    /**
     * @return {L.FeatureGroup}
     */
    _createStreetLayer: function () {
        var colors = _.shuffle(chroma.cubehelix().lightness([0.3, 0.7]).scale().colors(200));
        var layer = L.geoJson(streetsData, {
            style: function (feature) {
                if (feature.geometry.type === 'Point') {
                    var fillColor = '#000000';
                    if (feature.properties.groupId) {
                        fillColor = colors[feature.properties.groupId%colors.length]
                    }
                    return {
                        stroke: false,
                        fill: true,
                        fillColor: fillColor,
                        color: fillColor,
                        fillOpacity: 1
                    }
                } else {
                    return L.mapbox.simplestyle.style.apply(L.mapbox.simplestyle, arguments);
                }
            },
            pointToLayer: function (feature, latLng) {
                var radius = feature.properties.density * 10;
                return L.circleMarker(latLng, {
                    radius: radius
                });
            }
        });
        layer.on('mouseover', function (e) {
            var props = e.layer.feature.properties;
            var way = props.way;
            if (way) {
                console.log(way.tags.name || way.tags.highway);
            }
            if (props.hasOwnProperty('groupId')) {
                console.log('groupId', props.groupId);
            }
        }, this);
        return layer;
    },

    _onMapChange: function () {
        var center = this._map.getCenter();
        localStorage.setItem('zoom', this._map.getZoom());
        localStorage.setItem('lat', center.lat);
        localStorage.setItem('lng', center.lng);
    },

    /**
     * @param {string} modelField - field name in mapModel
     */
    _onMenuClick: function (modelField) {
        var currentValue = mapModel.get(modelField);
        mapModel.set(modelField, !currentValue);
    },
    render: function () {
        return React.DOM.div(
            {
                className: 'map'
            },
            React.DOM.div({
                className: 'map__map-node',
                ref: 'mapNode'
            }),
            buttonGroup(
                {
                    className: 'map__layers-select'
                },
                button({
                    className: classnames({
                        'is-active': mapModel.get('allVenues')
                    }),
                    onClick: this._onMenuClick.bind(this, 'allVenues')
                }, 'All venues'),
                button({
                    className: classnames({
                        'is-active': mapModel.get('streets')
                    }),
                    onClick: this._onMenuClick.bind(this, 'streets')
                }, 'Streets')
            )
        );
    }
}));
