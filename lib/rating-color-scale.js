/**
 * @module rating-color-scale
 */

'use strict';

var chroma = require('chroma-js');
var foursquareColors = require('./foursquare-colors');

/**
 * @param {Number} rating
 * @return {chroma.color} color
 */
module.exports = chroma
    .scale(foursquareColors())
    .domain([10, 4]);
