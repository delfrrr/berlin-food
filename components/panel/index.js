/**
 * view controller for right panel
 * @module components/panel
 */
'use strict';
var React = require('react');
var classnames = require('classnames');
var viewModel = require('../../lib/view-model');
var venueComponent = require('../venue');
require('./index.less');

var Component = React.createClass({
    componentDidMount: function () {
        var component = this;
        viewModel.on('change', function () {
            //TODO: use state?
            component.forceUpdate();
        });
    },
    render: function () {
        var selectedVenueTarget = viewModel.get('selectedVenueTarget');
        var venue;
        if (selectedVenueTarget) {
            venue = selectedVenueTarget.properties.venue;
        }
        return React.DOM.div(
            {
                className: classnames(this.props.className, 'panel')
            },
            selectedVenueTarget &&
            venueComponent({
                className: 'panel__venue',
                venue: venue
            }) ||
            React.DOM.div({
                className: 'panel__about'
            }, 'Hover venue to see details')
        );
    }
});

module.exports = React.createFactory(Component);
