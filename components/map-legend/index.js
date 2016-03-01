/**
 * short instruction about map usage
 * @module map-legend
 */

'use strict';

var React = require('react');
var classnames  = require('classnames');
var clusterColor = require('../../lib/cluster-color');
var PRICE_DICTIONARY = require('../../lib/price-dictionary')();
var util = require('util');
var foursquareColors = require('../../lib/foursquare-colors')();

require('./index.less');

var Component = React.createClass({
    render: function () {
        return React.DOM.div(
            {
                className: classnames(
                    'map-legend',
                    this.props.className
                ),
                onMouseMove: this.props.onMouseMove
            },
            React.DOM.h1(
                {
                    className: 'map-legend__name'
                },
                'Berlin Food'
            ),
            React.DOM.div(
                {
                    className: 'map-legend__description'
                },
                'Find Berlin destinations with good options of restaurants and cafes'
            ),
            React.DOM.div(
                {
                    className: 'map-legend__legend'
                },
                React.DOM.div(
                    {
                        className: 'map-legend__cluster'
                    },
                    React.DOM.div(
                        {
                            className: 'map-legend__cluster-label'
                        },
                        'Neighbourhood'
                    ),
                    React.DOM.div(
                        {
                            className: 'map-legend__street'
                        }
                    ),
                    React.DOM.div(
                        {
                            className: 'map-legend__street-label'
                        },
                        'Street'
                    ),
                    React.DOM.div(
                        {
                            className: 'map-legend__venue'
                        }
                    ),
                    React.DOM.div(
                        {
                            className: 'map-legend__venue-label'
                        },
                        'Venue'
                    )
                )
            ),
            React.DOM.div(
                {
                    className: 'map-legend__cluster-scale'
                },
                React.DOM.div(
                    {
                        className: 'map-legend__cluster-scale-bar',
                        style: {
                            background: util.format(
                                'linear-gradient(to right, %s 0%, %s 100%)',
                                clusterColor(0),
                                clusterColor(clusterColor.MAX_CLUSTER_SIZE)
                            )
                        }
                    }
                ),
                React.DOM.div(
                    {
                        className: 'map-legend__cluster-scale-label_left'
                    },
                    '0'
                ),
                React.DOM.div(
                    {
                        className: 'map-legend__cluster-scale-label_right'
                    },
                    clusterColor.MAX_CLUSTER_SIZE
                ),
                React.DOM.div(
                    {
                        className: 'map-legend__cluster-scale-label_bottom'
                    },
                    'Venues'
                )
            )
        );
    }
});

module.exports = React.createFactory(Component);
