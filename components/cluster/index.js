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
                clusterId: cluster.clusterId,
                foodRatings: cluster.foodRatings,
                className: 'cluster__food-rating',
                lngLat: cluster.lngLat,
                radius: Math.floor(cluster.radius * 1000) //m
            }),
            ratingPriceComponent({
                priceByRating: cluster.priceByRating,
                className: 'cluster__rating-price'
            }),
            React.DOM.div(
                {
                    className: classnames(
                        'cluster__label',
                        'cluster__label_food-rating'
                    )
                },
                'Number of venues by category ordered by expected rating'
            ),
            React.DOM.div(
                {
                    className: classnames(
                        'cluster__label',
                        'cluster__label_rating-price'
                    )
                },
                'Number of values by rating and price'
            )
        );
    }
});

module.exports = React.createFactory(Component);
