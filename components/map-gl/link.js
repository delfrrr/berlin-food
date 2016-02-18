/**
 * link which appears under cursor when user hovers venue
 * @module link
 */

'use strict';

var React = require('react');
var viewModel = require('../../lib/view-model');
var chroma = require('chroma-js');
var _ = require('lodash');
var Component = React.createClass({
    getInitialState: function () {
        return {
            target: '_blank',
            style: {
                position: 'absolute',
                top: 100,
                left: 100,
                width: 20,
                height: 20,
                backgroundColor: 'gold',
                display: 'none',
                cursor: 'pointer'
            }
        }
    },
    componentWillMount: function () {
        var component = this;
        viewModel.on('change:selectedVenueTarget', function () {
            var venueTarget = viewModel.get('selectedVenueTarget');
            var point = viewModel.get('selectedVenuePosition');
            var newState = {
                style: _.clone(component.state.style)
            };
            var style = newState.style;
            if (venueTarget) {
                var radius = venueTarget.layer.paint['circle-radius'];
                var venue = venueTarget.properties.venue;
                style.display = 'block';
                style.left = point.x - radius;
                style.top = point.y - radius;
                style.width = radius * 2;
                style.height = radius * 2;
                style.borderRadius = radius;
                style.backgroundColor = chroma.gl.apply(chroma, venueTarget.layer.paint['circle-color']).darken(1).css();
                newState.href = 'https://foursquare.com/venue/' + venue.id;
            } else {
                style.display = 'none';
            }
            component.setState(newState);
        });
    },
    render: function () {
        return React.DOM.a(this.state);
    }
});

module.exports = React.createFactory(Component);
