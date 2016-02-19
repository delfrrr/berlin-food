/**
 * food rating bars
 * @module food-rating
 */
'use strict';
var React = require('react');
var classnames = require('classnames');
// require('./index.less');
var Component = React.createClass({
    render: function () {
        var foodRatings = this.props.foodRatings;
        console.log(foodRatings);
        return React.DOM.div(
            {
                className: classnames(
                    this.props.className,
                    'food-rating'
                )
            },
            foodRatings.map(function (ratingItem, k) {
                return React.DOM.div(
                    {
                        key: k
                    },
                    ratingItem.category.shortName
                );
            })
        );
    }
});

module.exports = React.createFactory(Component);
