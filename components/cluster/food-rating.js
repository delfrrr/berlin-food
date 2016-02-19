/**
 * food rating bars
 * @module food-rating
 */
'use strict';
var React = require('react');
var classnames = require('classnames');
require('./food-rating.less');
var chroma = require('chroma-js');
/**
 * @param {Number} rating
 * @return {Sting} color
 */
var ratingColorScale = chroma
    .scale([
        '#00b551',
        '#73cf42',
        '#C5DE35',
        '#FFC800',
        '#FF9600',
        '#FF6701',
        '#E6092C'])
    .domain([10, 4]);

var Component = React.createClass({
    render: function () {
        var foodRatings = this.props.foodRatings;
        return React.DOM.div(
            {
                className: classnames(
                    this.props.className,
                    'food-rating'
                )
            },
            foodRatings.map(function (ratingItem, k) {
                var color = ratingColorScale(ratingItem.rating + 2); //becouse 7 is max
                var countBarLength = ratingItem.count * 10;
                var ratingBarSize = 3 * ratingItem.rating || 3;
                return React.DOM.div(
                    {
                        className: 'food-rating__rating-item',
                        key: k
                    },
                    React.DOM.div(
                        {
                            className: 'food-rating__short-name'
                        },
                        ratingItem.category.shortName.split('/')[0].trim()
                    ),
                    React.DOM.div(
                        {
                            className: 'food-rating__bar'
                        },
                        React.DOM.div(
                            {
                                className: 'food-rating__count-bar',
                                style: {
                                    width: countBarLength,
                                    backgroundColor: color
                                }
                            }
                        ),
                        (ratingItem.count > 1) && React.DOM.div(
                            {
                                className: 'food-rating__count-bar-value',
                                style: {
                                    left: countBarLength / 2
                                }
                            },
                            ratingItem.count
                        ),
                        React.DOM.div(
                            {
                                className: 'food-rating__rating-bar',
                                style: {
                                    left: countBarLength,
                                    width:   ratingBarSize,
                                    height:  ratingBarSize,
                                    backgroundColor: color
                                }
                            }
                        )
                    )

                );
            })
        );
    }
});

module.exports = React.createFactory(Component);
