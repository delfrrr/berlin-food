/**
 * cluster info panel
 * @module component/cluster
 */
'use strict';
var React = require('react');
var classnames = require('classnames');
var foodRatingComponent = require('./food-rating');
require('./index.less');
var Component = React.createClass({
    render: function () {
        var cluster = this.props.cluster;
        return React.DOM.div(
            {
                className: classnames(
                    this.props.className,
                    'cluster'
                )
            },
            foodRatingComponent({
                foodRatings: cluster.foodRatings,
                className: 'cluster__food-rating'
            })
        );
    }
});

module.exports = React.createFactory(Component);
