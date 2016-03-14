/**
 * food rating bars
 * @module food-rating
 */
'use strict';
var React = require('react');
var classnames = require('classnames');
var url = require('url');
var util = require('util');
var priceDistionary = require('../../lib/price-dictionary')();
var categoryUrlObj = url.parse('https://foursquare.com/explore');
var  _  = require('lodash');
var viewModel = require('../../lib/view-model');

require('./food-rating.less');

var ratingColorScale =  require('../../lib/rating-color-scale');

function getVenuesByCategory(clusterId) {
    var venuePoints = viewModel.get('venuesByClusterId')[clusterId];
    /**
     * @type {Object.<VenueCategory.id, Point>}
     */
    var venuesByCategoryId = {};

    venuePoints.forEach(function (vp) {
        var venue = vp.properties.venue;
        var category = venue.categories && venue.categories[0];
        if (category && venue.rating) {
            venuesByCategoryId[category.id] = (
                venuesByCategoryId[category.id] || []
            ).concat([venue]);
        }
    });
    _.forEach(venuesByCategoryId, function (venues) {
        venues.sort(function (v1, v2) {
            return v1.rating - v2.rating;
        });
    })
    return venuesByCategoryId;
}

var Component = React.createClass({
    render: function () {
        var foodRatings = this.props.foodRatings;
        var venuesByCategory = getVenuesByCategory(this.props.clusterId);
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
                var icon = ratingItem.category.icon;
                var venues = venuesByCategory[ratingItem.category.id];
                if (!venues) {
                    return null;
                }
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
                        venues.map(function (venue, k) {
                            return React.DOM.a(
                                {
                                    className: 'food-rating__icon',
                                    target: '_blank',
                                    key: k,
                                    href: 'https://foursquare.com/venue/' + venue.id,
                                    title: util.format(
                                        '%s \nRating: %s\nPrice: %s',
                                        venue.name,
                                        venue.rating,
                                        venue.price ? priceDistionary[venue.price.tier] : 'unknown'
                                    ),
                                    style: {
                                        WebkitMask: util.format(
                                            'url(%s)',
                                            [icon.prefix, '32', icon.suffix].join('')
                                        ),
                                        maskType: 'alpha',
                                        background: ratingColorScale(Math.floor(venue.rating))
                                    }
                                }
                            )

                        })
                    )
                );
            })
        );
    }
});

module.exports = React.createFactory(Component);
