/**
 * hilight cluster
 * @module cluster-hilight
 */

'use strict';

var React = require('react');
var viewModel = require('../../lib/view-model');
var _ = require('lodash');
var Component = React.createClass({
    getInitialState: function () {
        return {
            style: {
                position: 'absolute',
                top: 100,
                left: 100,
                width: 20,
                height: 20,
                pointerEvents:'none',
                borderColor: 'gold',
                borderWidth: '2px',
                borderStyle: 'solid',
                display: 'none',
                cursor: 'pointer'
            }
        }
    },
    componentWillMount: function () {
        var component = this;
        viewModel.on('change', function () {
            var clusterTarget = viewModel.get('selectedClusterTarget');
            var venueTarget = viewModel.get('selectedVenueTarget');
            var point = viewModel.get('selectedClusterPosition');
            var newState = {
                style: _.clone(component.state.style)
            };
            var style = newState.style;
            if (clusterTarget && !venueTarget) {
                var radius = clusterTarget.layer.paint['circle-radius'] - 1;
                style.display = 'block';
                style.left = point.x - radius - 2;
                style.top = point.y - radius - 2;
                style.width = radius * 2;
                style.height = radius * 2;
                style.borderRadius = radius * 2;
                // style.borderColor = chroma.gl.apply(chroma, clusterTarget.layer.paint['circle-color']).darken(1).css();
                style.borderColor = 'white';
            } else {
                style.display = 'none';
            }
            component.setState(newState);
        });
    },
    render: function () {
        return React.DOM.div(this.state);
    }
});

module.exports = React.createFactory(Component);
