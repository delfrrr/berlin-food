/**
 * venue icon radius by rating
 * @module venue-radius
 */

'use strict';

var scale = require('d3-scale');

/**
 * @type {function}
 * @param {Venue.rating}
 * @return {Number} circle max radius px
 */
module.exports = scale.scalePow()
    .exponent(3)
    .domain([1, 9])
    .range([1, 25]);
