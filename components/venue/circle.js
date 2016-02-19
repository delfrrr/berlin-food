/**
 * circle bar
 * @module component/venue/cirlce
 */
'use strict';
var React = require('react');
var classnames = require('classnames');
var animatedArc  = require('./animated-arc');

require('./circle.less');

var Component = React.createClass({
    render: function () {
        var value = this.props.value;
        var unknown = !value;
        var size = -1;
        if (!unknown) {
            size = this.props.value / this.props.maxValue;
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
                React.DOM.circle(
                    {
                        cx: 50,
                        cy: 50,
                        r: 40.5,
                        strokeStyle: 'solid',
                        strokeWidth: '1px',
                        stroke: '#222',
                        fill: 'transparent'
                    }
                ),
                animatedArc({
                    transform: 'translate(50, 50)',
                    innerRadius: 40,
                    outerRadius: 41,
                    startAngle: 0,
                    endAngle: Math.PI * 2 * size * (-1),
                    fill: unknown? 'transparent' : this.props.color
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
