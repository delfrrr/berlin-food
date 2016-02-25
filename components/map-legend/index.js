/**
 * short instruction about map usage
 * @module map-legend
 */

'use strict';

var React = require('react');
var classnames  = require('classnames');

require('./index.less');

var Component = React.createClass({
    render: function () {
        return React.DOM.div(
            {
                className: classnames(
                    'map-legend',
                    this.props.className
                )
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
            )
        );
    }
});

module.exports = React.createFactory(Component);
