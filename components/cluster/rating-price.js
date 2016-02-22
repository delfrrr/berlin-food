/**
 * @module rating-price
 */
'use strict';
var React = require('react');
var classnames = require('classnames');
var _ = require('lodash');
var util = require('util');
var DEFAULT_RATINGS = {
    '9': {total: 0},
    '8': {total: 0},
    '7': {total: 0},
    '6': {total: 0},
    '5': {total: 0},
    '4': {total: 0}
};
var DEFAULT_PRICES = {
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0
};

var PRICE_DICTIONARY = require('../../lib/price-dictionary')();
var priceColorScale = require('../../lib/price-color-scale');

require('./rating-price.less');

var Component = React.createClass({
    render: function () {
        var priceByRating = _.defaults({}, this.props.priceByRating, DEFAULT_RATINGS);
        var maxTotal = Math.max.apply(Math, Object.keys(priceByRating).map(function (rating) {
            return priceByRating[rating].total;
        }));
        return React.DOM.div(
            {
                className: classnames(
                    this.props.className,
                    'rating-price'
                )
            },
            Object.keys(priceByRating).filter(function (rating) {
                return Number(rating) > 4;
            }).sort(function (r1, r2) {
                return r2 - r1;
            }).map(function (rating, k, arr) {
                var ratingData = priceByRating[rating];
                var prevHeight = 0;
                var prices = _.defaults({}, ratingData.prices || {}, DEFAULT_PRICES);
                return React.DOM.div(
                    {
                        className: 'rating-price__bar-item',
                        style: {
                            width: 100/arr.length + '%'
                        },
                        key: k
                    },
                    React.DOM.div(
                        {
                            className: 'rating-price__bar-label',
                            title: 'Rating'
                        },
                        rating
                    ),
                    Object.keys(prices).sort().map(function (priceTier, k) {
                        var value = prices[priceTier];
                        var height = value / maxTotal * 100;
                        prevHeight += height;
                        return React.DOM.div(
                            {
                                className: 'rating-price__bar',
                                title: util.format(
                                    'price: %s, venues: %s',
                                    PRICE_DICTIONARY[priceTier],
                                    value
                                ),
                                key: k,
                                style: {
                                    height: prevHeight,
                                    zIndex: 10 - priceTier,
                                    backgroundColor: priceColorScale(Number(priceTier))
                                }
                            }
                        )
                    })
                );
            })
        );
    }
});

module.exports = React.createFactory(Component);
