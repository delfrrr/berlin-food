/**
 * @module components/map
 */

var React = require('react');
var L = require('mapbox');
var allVenues = require('../../geojson/all-venues.json');

require('./index.less');

module.exports = React.createFactory(React.createClass({
    componentDidMount: function () {
        var component = this;
        //hack becouse we do not mount to body at once
        setTimeout(function () {
            L.mapbox
                .map(component.refs.mapNode, 'mapbox.streets')
                .setView([52.516667, 13.383333], 9)
                .featureLayer
                .setGeoJSON(allVenues);
        });
    },
    render: function () {
        return React.DOM.div({
            className: 'map',
            ref: 'mapNode'
        });
    }
}));
