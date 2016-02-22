/**
 * view for venue in right panel
 * @module component/venue
 */
'use strict';
var React = require('react');
var classnames = require('classnames');
var circleComponent = require('./circle');
var scale = require('d3-scale');
require('./index.less');
var PRICE_DICTIONARY = require('../../lib/price-dictionary')();
var priceColorScale = require('../../lib/price-color-scale');

/**
 * @typedef {function} ColorScale
 * @param {number} value
 * @return {Chroma.color}
 */

/**
 * @constant {String[]} colors
 */
var COLORS = require('../../lib/foursquare-colors')();
var chroma = require('chroma-js');

/**
 * @type ColorScale
 */
var votesColorScale = chroma.scale(COLORS).domain([20, 50]);

/**
 * @type ColorScale
 */
var usersColorScale = chroma.scale(COLORS).domain([0, 100]);

var Component = React.createClass({
    render: function () {
        var venue = this.props.venue;
        var categories = venue.categories;
        var icon;
        var categoriesText;
        var rating = venue.rating;
        var price = venue.price || {};
        var userCountScale = scale.scaleLinear().domain([0, 100, 1000, this.props.maxUserCount]).range([0, 25, 50, 100]);

        if (categories) {
            icon = categories && categories[0] && categories[0].icon;
            categoriesText = categories.map(function (c) {
                return c.shortName;
            }).join(', ');
        }
        var userCountScaled = userCountScale(venue.stats.usersCount);
        return React.DOM.div(
            {
                className: classnames(this.props.className, 'venue')
            },
            React.DOM.div(
                {
                    className: 'venue__info'
                },
                icon && React.DOM.img(
                    {
                        className: 'venue__icon',
                        src: [icon.prefix, '44', icon.suffix].join('')
                    }
                ),
                React.DOM.a(
                    {
                        className: 'venue__name',
                        target: '_blank',
                        href: 'https://foursquare.com/venue/' + venue.id
                    },
                    venue.name
                ),
                categoriesText && React.DOM.div(
                    {
                        className: 'venue__category'
                    },
                    categoriesText
                )
            ),
            React.DOM.div(
                {
                    className: 'venue__circles'
                },
                React.DOM.div(
                    {
                        className: 'venue__circle-wraper'
                    },
                    circleComponent({
                        maxValue: 4,
                        className: 'venue__circle',
                        value: rating - 6,
                        valueTitle: rating,
                        color: '#' + venue.ratingColor,
                        label: 'Rating'
                    })
                ),
                React.DOM.div(
                    {
                        className: 'venue__circle-wraper'
                    },
                    circleComponent({
                        maxValue: 4,
                        className: 'venue__circle',
                        value: price.tier,
                        valueTitle: PRICE_DICTIONARY[price.tier],
                        color: String(priceColorScale(price.tier)),
                        label: 'Price'
                    })
                ),
                React.DOM.div(
                    {
                        className: 'venue__circle-wraper'
                    },
                    circleComponent({
                        maxValue: 100,
                        className: 'venue__circle',
                        value: userCountScaled,
                        valueTitle: venue.stats.usersCount,
                        color: String(usersColorScale(userCountScaled)),
                        label: 'Users'
                    })
                ),
                React.DOM.div(
                    {
                        className: 'venue__circle-wraper'
                    },
                    circleComponent({
                        maxValue: venue.stats.usersCount,
                        className: 'venue__circle',
                        value: venue.ratingSignals,
                        valueTitle: Math.round(venue.ratingSignals/venue.stats.usersCount * 100) + ' %',
                        color: String(votesColorScale(venue.ratingSignals/venue.stats.usersCount * 100)),
                        label: 'Votes per Users'
                    })
                )
            )
        );
    }
});

module.exports = React.createFactory(Component);
