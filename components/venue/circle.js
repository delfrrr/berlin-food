/**
 * circle bar
 * @module component/venue/cirlce
 */
'use strict';
var React = require('react');
var classnames = require('classnames');
// var reactTransition = React.createFactory(require('react-transition'));
var arc = require('d3-shape').arc();

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
                React.DOM.path({
                    transform: 'translate(50, 50)',
                    d: arc({
                        innerRadius: 40,
                        outerRadius: 42,
                        startAngle: 0,
                        endAngle: Math.PI * 2 * size * (-1)
                    }),
                    fill: this.props.color
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
