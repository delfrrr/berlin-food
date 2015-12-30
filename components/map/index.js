/**
 * @module components/map
 */

var React = require('react');
var _  = require('lodash');
var L = require('mapbox');
var allVenues = require('../../geojson/all-venues.json');
var mapModel = require('./model');
var classnames = require('classnames');
var button = React.createFactory(require('elemental/lib/components/Button'));
var buttonGroup = React.createFactory(require('elemental/lib/components/ButtonGroup'));

require('elemental/less/elemental.less');
require('./index.less');

module.exports = React.createFactory(React.createClass({
    componentDidMount: function () {
        var component = this;
        this._map = L.mapbox
            .map(component.refs.mapNode, 'mapbox.streets-basic')
            .setView([52.516667, 13.383333], 9);
        this._venuesLayer = L.mapbox.featureLayer(allVenues);
        mapModel.on('change', function () {
            //TODO: store model in state
            component.forceUpdate();
        });
        mapModel.on('change:allVenues', _.debounce(function (e, value) {
            var method = value ? 'addLayer' : 'removeLayer';
            component._map.featureLayer[method](component._venuesLayer);
        }));
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
                }, 'Streets')
            )
        );
    }
}));
