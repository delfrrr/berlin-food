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
                React.DOM.div(
                    {
                        className: 'venue__name'
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
                        valueTitle: price.message,
                        color: '#' + venue.ratingColor,
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
                        value: userCountScale(venue.stats.usersCount),
                        valueTitle: venue.stats.usersCount,
                        color: '#' + venue.ratingColor,
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
                        valueTitle: Math.round(venue.ratingSignals/venue.stats.usersCount * 100) + '%',
                        color: '#' + venue.ratingColor,
                        label: 'Votes per Users'
                    })
                )
            )
        );
    }
});

module.exports = React.createFactory(Component);
