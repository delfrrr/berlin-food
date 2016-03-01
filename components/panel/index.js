/**
 * view controller for right panel
 * @module components/panel
 */
'use strict';
var React = require('react');
var classnames = require('classnames');
var viewModel = require('../../lib/view-model');
var venueComponent = require('../venue');
var clusterComponent = require('../cluster');
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
        var selectedClusterTarget = viewModel.get('selectedClusterTarget');
        var venue;
        var cluster;
        if (selectedVenueTarget) {
            venue = selectedVenueTarget.properties.venue;
        }
        if (selectedClusterTarget) {
            cluster = selectedClusterTarget.properties;
        }
        return React.DOM.div(
            {
                className: classnames(
                    this.props.className,
                    'panel',
                    {
                        'panel_sliding': cluster && !selectedVenueTarget
                    }
                )
            },
            React.DOM.div(
                {
                    className: 'panel__inner'
                },
                (selectedVenueTarget && venueComponent({
                    className: 'panel__venue',
                    venue: venue,
                    maxUserCount: viewModel.get('maxUserCount')
                })) ||
                (cluster && clusterComponent({
                    className: 'panel__cluster',
                    cluster: cluster
                })) ||
                React.DOM.div(
                    {
                        className: 'panel__about'
                    },
                    React.DOM.div(
                        {
                            className: 'panel__about-icon'
                        }
                    ),
                    'Hover circles to see details'
                )
            )
        );
    }
});

module.exports = React.createFactory(Component);
