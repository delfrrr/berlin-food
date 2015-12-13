/**
 * @module components/map
 */

var React = require('react');
var L = require('mapbox');

module.exports = React.createFactory(React.createClass({
    componentDidMount: function () {
        L.mapbox.map(this.refs.mapNode, 'mapbox.streets').setView([37.8, -96], 4);
    },
    render: function () {
        return React.DOM.div({
            className: 'map',
            ref: 'mapNode'
        });
    }
}));
