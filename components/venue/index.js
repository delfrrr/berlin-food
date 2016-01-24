/**
 * view for venue in right panel
 * @module component/venue
 */
'use strict';
var React = require('react');
var classnames = require('classnames');

var Component = React.createClass({
    render: function () {
        var venue = this.props.venue;
        return React.DOM.div(
            {
                className: classnames(this.props.className, 'venue')
            },
            venue.name
        );
    }
});

module.exports = React.createFactory(Component);
