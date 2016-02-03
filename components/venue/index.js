/**
 * view for venue in right panel
 * @module component/venue
 */
'use strict';
var React = require('react');
var classnames = require('classnames');
var circleComponent = require('./circle');
var util = require('util');
var url = require('url');
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
        if (website) {
            var urlObj = url.parse(website);
        }
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
            address && React.DOM.a(
                {
                    href: util.format(
                        'https://maps.google.com/maps?ll=%s,%s&q=%s,%s&hl=en&t=m&z=16',
                        venue.location.lat,
                        venue.location.lng,
                        venue.location.lat,
                        venue.location.lng
                    ),
                    target: '_blank',
                    className: 'venue__address'
                },
                address
            ),
            phone && React.DOM.a(
                {
                    href: 'tel:phone',
                    className: 'venue__phone'
                },
                phone
            ),
            website && React.DOM.a(
                {
                    href: 'website',
                    target: '_blank',
                    className: 'venue__website'
                },
                urlObj.hostname + urlObj.pathname
            ),
            React.DOM.div(
                {
                    className: 'venue__circles'
                },
                circleComponent({
                    maxValue: 4,
                    className: 'venue__circle',
                    value: rating - 6,
                    valueTitle: rating,
                    color: '#' + venue.ratingColor,
                    label: 'Rating'
                }),
                circleComponent({
                    maxValue: 4,
                    className: 'venue__circle',
                    value: price.tier,
                    valueTitle: price.message,
                    color: '#' + venue.ratingColor,
                    label: 'Price'
                }),
                circleComponent({
                    maxValue: this.props.maxUserCount,
                    className: 'venue__circle',
                    value: venue.stats.usersCount,
                    valueTitle: venue.stats.usersCount,
                    color: '#' + venue.ratingColor,
                    label: 'Users'
                }),
                circleComponent({
                    maxValue: venue.stats.usersCount,
                    className: 'venue__circle',
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