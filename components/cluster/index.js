/**
 * cluster info panel
 * @module component/cluster
 */
'use strict';
var React = require('react');
var classnames = require('classnames');
var foodRatingComponent = require('./food-rating');
var ratingPriceComponent = require('./rating-price');
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
                className: 'cluster__food-rating',
                lngLat: cluster.lngLat,
                radius: Math.floor(cluster.radius * 1000) //m
            }),
            ratingPriceComponent({
                priceByRating: cluster.priceByRating,
                className: 'cluster__rating-price'
            })
        );
    }
});

module.exports = React.createFactory(Component);
