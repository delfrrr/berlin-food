/**
 * circle bar
 * @module component/venue/cirlce
 */
'use strict';
var React = require('react');
var classnames = require('classnames');
var reactTransition = React.createFactory(require('react-transition'));

require('./circle.less');

var Component = React.createClass({
    render: function () {
        var value = this.props.value;
        var unknown = !value;
        var size = Math.sqrt(0.5);
        if (!unknown) {
            size = Math.sqrt(this.props.value / this.props.maxValue);
        }
        return React.DOM.div(
            {
                className: classnames(
                    this.props.className,
                    'venue-circle',
                    {
                        'venue-circle_unknown': unknown
                    }
                )
            },
            React.DOM.svg(
                {
                    viewBox: "0 0 100 100"
                },
                React.DOM.circle({
                    cx: 50,
                    cy: 50,
                    r: 50,
                    fill: this.props.color
                }),
                reactTransition({
                    component: 'circle',
                    cx: 50,
                    cy: 50,
                    r: 24 - size * 24 + 25,
                    duration: 200,
                    ease: 'linear',
                    fill: 'white'
                })
            ),
            React.DOM.div(
                {
                    className: 'venue-circle__value'
                },
                this.props.valueTitle || this.props.value || '?'
            ),
            React.DOM.div(
                {
                    className: 'venue-circle__label'
                },
                this.props.label
            )

        );
    }
});

module.exports = React.createFactory(Component);
