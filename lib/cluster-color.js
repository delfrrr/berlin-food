/**
 * @module components/map/cluster-color
 */

'use strict';

var chroma = require('chroma-js');

/**
 * @type {Array.<Color>}
 */
var COLORS = chroma.cubehelix().lightness([0.3, 0.5]).scale().colors(20);

/**
 * @param {ClusterId} clusterId
 * @return {Color}
 */
module.exports = function (clusterId) {
    return COLORS[clusterId % COLORS.length];
}
