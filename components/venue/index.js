/**
 * view for venue in right panel
 * @module component/venue
 */
'use strict';
var React = require('react');
var classnames = require('classnames');
require('./index.less');

var Component = React.createClass({
    render: function () {
        var venue = this.props.venue;
        var categories = venue.categories;
        var icon;
        var categoriesText;
        var phone = venue.contact && venue.contact.phone;
        var address = venue.location.address;
        // var price = venue.price && venue.price.message;
        // var rating = venue.rating;
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
            )//,
            // price && React.DOM.div(
            //     {
            //         className: 'venue__price'
            //     },
            //     price
            // ),
            // rating && React.DOM.div(
            //     {
            //         className: 'venue__rating'
            //     },
            //     rating
            // )
        );
    }
});

module.exports = React.createFactory(Component);
