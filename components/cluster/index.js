/**
 * cluster info panel
 * @module component/cluster
 */
'use strict';
var React = require('react');
var classnames = require('classnames');

var Component = React.createClass({
    render: function () {
        return React.DOM.div(
            {
                className: classnames(
                    this.props.className,
                    'cluster'
                )
            },
            'cluster'
        );
    }
});

module.exports = React.createFactory(Component);
