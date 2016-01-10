/**
 * min cluster size from zoom level
 * @module components/map/min-cluster-size
 */

var scale = require('d3-scale');

/**
 * @type {Function}
 * @param {Number} zoom
 * @return {Number} min number of venues
 */
module.exports = scale
    .scaleLinear()
    .domain([14, 16])
    .range([10,  1]);
