/**
 * food rating bars
 * @module food-rating
 */
'use strict';
var React = require('react');
var classnames = require('classnames');
var chroma = require('chroma-js');
var getRadius = require('../../lib/venue-radius');
var scale = require('d3-scale');

require('./food-rating.less');

/**
 * @param {number} count - number of venues
 * @return {number} percentage
 */
var getCountLength = scale
    .scaleLinear()
    .range([10, 100])
    .domain([1, 18]);

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
                var countBarLength = Math.floor(getCountLength(ratingItem.count)) + '%';
                var ratingBarSize = Math.floor(getRadius(ratingItem.rating + 2));
                if (ratingBarSize < 5) {
                    ratingBarSize = 5;
                }
                var icon = ratingItem.category.icon;
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
                        React.DOM.img(
                            {
                                className: 'food-rating__icon',
                                src: [icon.prefix, '32', icon.suffix].join('')
                            }
                        ),
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
                                    left: parseInt(countBarLength) / 2 + '%'
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
                                    // backgroundColor: color,
                                    borderColor: color,
                                    borderRadius: ratingBarSize
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
