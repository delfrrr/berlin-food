/**
 * @module components/map
 */

var React = require('react');
var _  = require('lodash');
var L = require('mapbox');
var allVenues = require('../../geojson/all-venues.json');
var streetsData = require('../../geojson/streets.json');
var mapModel = require('./model');
var classnames = require('classnames');
var button = React.createFactory(require('elemental/lib/components/Button'));
var buttonGroup = React.createFactory(require('elemental/lib/components/ButtonGroup'));

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
            streets: L.mapbox.featureLayer(streetsData)
        };
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
