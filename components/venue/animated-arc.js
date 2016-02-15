/**
 * react component for animated arc path
 * @module component/venue/animated-arc
 */
'use strict';
var React = require('react');
var arc = require('d3-shape').arc();
var d3i = require('d3-interpolate');
var _ = require('lodash');
var DURATION = 400; //ms

var Component = React.createClass({
    getInitialState: function () {
        return this.props;
    },
    componentWillReceiveProps: function (newProps) {
        var component = this;
        var interpolator = d3i.interpolate(this.props, newProps);
        var start = Date.now();
        this._animation = function () {
            if (!component.isMounted ) {
                return;
            }
            var now = Date.now();
            var t = (now - start) / DURATION;
            if (t > 1) {
                t = 1;
            }
            var state = interpolator(t);
            component.setState(state);
            if (t < 1) {
                window.requestAnimationFrame(component._animation);
            }
        }
        window.requestAnimationFrame(component._animation);
    },
    componentWillUnmount: function () {
        this._animation = function () {}
    },
    render: function () {
        var pathProps = _.clone(this.state);
        pathProps.d = arc(pathProps);
        return React.DOM.path(pathProps);
    }
});

module.exports = React.createFactory(Component);
