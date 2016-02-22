/**
 * @module price-color-scale
 */
'use strict';

var foursquareColors = require('./foursquare-colors');
var chroma = require('chroma-js');

/**
 * @param {Venue.price.tier}
 * @return {chroma.color} color
 */
module.exports = chroma.scale(foursquareColors()).domain([1,4]);
