/**
 * vertical bar
 * @module component/venue/bar
 */
'use strict';
var React = require('react');
var classnames = require('classnames');
require('./bar.less');

var Component = React.createClass({
    render: function () {
        var value = this.props.value;
        var unknown = !value;
        var height = 50;
        if (!unknown) {
            height = Math.round(this.props.value / this.props.maxValue * 100);
        }
        return React.DOM.div(
            {
                className: classnames(
                    this.props.className,
                    'venue-bar',
                    {
                        'venue-bar_unknown': unknown
                    }
                )
            },
            React.DOM.div(
                {
                    className: 'venue-bar__bar',
                    style: {
                        height: height + '%',
                        backgroundColor: !unknown && this.props.color
                    }
                },
                React.DOM.div(
                    {
                        className: 'venue-bar__value'
                    },
                    this.props.valueTitle || this.props.value || '?'
                )
            ),
            React.DOM.div(
                {
                    className: 'venue-bar__label'
                },
                this.props.label
            )
        );
    }
});

module.exports = React.createFactory(Component);
