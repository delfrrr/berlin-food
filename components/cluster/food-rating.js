/**
 * food rating bars
 * @module food-rating
 */
'use strict';
var React = require('react');
var classnames = require('classnames');
var getRadius = require('../../lib/venue-radius');
var scale = require('d3-scale');
var url = require('url');
var categoryUrlObj = url.parse('https://foursquare.com/explore');
var  _  = require('lodash');

require('./food-rating.less');

/**
 * @param {number} count - number of venues
 * @return {number} percentage
 */
var getCountLength = scale
    .scaleLinear()
    .range([10, 100])
    .domain([1, 18]);

var ratingColorScale =  require('../../lib/rating-color-scale');

var Component = React.createClass({
    render: function () {
        var foodRatings = this.props.foodRatings;
        var lngLat = this.props.lngLat;
        var radius = this.props.radius;
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
                var ratingBarSize = Math.floor(getRadius(ratingItem.rating));
                if (ratingBarSize < 5) {
                    ratingBarSize = 5;
                }
                var icon = ratingItem.category.icon;
                return React.DOM.div(
                    {
                        className: 'food-rating__rating-item',
                        key: k
                    },
                    React.DOM.a(
                        {
                            className: 'food-rating__short-name',
                            target: '_blank',
                            href: url.format(_.assign({}, categoryUrlObj, {
                                query: {
                                    ll: [lngLat.lat, lngLat.lng].join(','),
                                    q: ratingItem.category.shortName,
                                    radius: radius
                                }
                            }))
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
                        React.DOM.div(
                            {
                                className: 'food-rating__count-bar-value',
                                title: 'Number of venues',
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
