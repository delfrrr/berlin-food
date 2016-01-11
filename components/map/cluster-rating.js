/**
 * min cluster rating from zoom level
 * @module cluster-rating
 */

var scale = require('d3-scale');

/**
 * @type {Function}
 * @param {Number} zoom
 * @return {Number} min rating
 */
module.exports = scale
    .scaleLinear()
    .domain([1, 13, 15, 16])
    .range([7, 7, 4, 3]);
