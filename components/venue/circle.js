/**
 * circle bar
 * @module component/venue/cirlce
 */
'use strict';
var React = require('react');
var classnames = require('classnames');
var reactTransition = React.createFactory(require('react-transition'));

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
                reactTransition({
                    component: 'circle',
                    cx: 50,
                    cy: 50,
                    r: size * 50,
                    duration: 200,
                    ease: 'linear',
                    fill: this.props.color
                })
            )
        );
    }
});

module.exports = React.createFactory(Component);
