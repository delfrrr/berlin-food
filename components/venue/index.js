/**
 * view for venue in right panel
 * @module component/venue
 */
'use strict';
var React = require('react');
var classnames = require('classnames');
var barComponent = require('./bar');
require('./index.less');

var Component = React.createClass({
    render: function () {
        var venue = this.props.venue;
        var categories = venue.categories;
        var icon;
        var categoriesText;
        var phone = venue.contact && venue.contact.phone;
        var address = venue.location.address;
        var rating = venue.rating;
        var price = venue.price || {};
        var website = venue.url;
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
            icon && React.DOM.img(
                {
                    className: 'venue__icon',
                    src: [icon.prefix, '32', icon.suffix].join('')
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
            ),
            address && React.DOM.div(
                {
                    className: 'venue__address'
                },
                address
            ),
            phone && React.DOM.div(
                {
                    className: 'venue__phone'
                },
                phone
            ),
            website && React.DOM.div(
                {
                    className: 'venue__website'
                },
                website
            ),
            React.DOM.div(
                {
                    className: 'venue__bars'
                },
                barComponent({
                    maxValue: 5,
                    className: 'venue__bar',
                    value: rating - 5,
                    valueTitle: rating,
                    color: '#' + venue.ratingColor,
                    label: 'Rating'
                }),
                barComponent({
                    maxValue: 4,
                    className: 'venue__bar',
                    value: price.tier,
                    valueTitle: price.message,
                    color: '#' + venue.ratingColor,
                    label: 'Price'
                }),
                barComponent({
                    maxValue: this.props.maxUserCount,
                    className: 'venue__bar',
                    value: venue.stats.usersCount,
                    valueTitle: venue.stats.usersCount,
                    color: '#' + venue.ratingColor,
                    label: 'Users'
                }),
                barComponent({
                    maxValue: venue.stats.usersCount,
                    className: 'venue__bar',
                    value: venue.ratingSignals,
                    valueTitle: Math.round(venue.ratingSignals/venue.stats.usersCount * 100) + '%',
                    color: '#' + venue.ratingColor,
                    label: 'Signals'
                })
            )
        );
    }
});

module.exports = React.createFactory(Component);
