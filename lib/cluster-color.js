/**
 * @module components/map/cluster-color
 */

'use strict';

var chroma = require('chroma-js');
//TODO: do not hardcode it
var MAX_CLUSTER_SIZE = 143;
var MAX_CLUSTER_SIZE_LOG = Math.log(MAX_CLUSTER_SIZE);
var MAX_COLORS = 20;

var scale = chroma.scale(['#F94877', '#0732A2']).domain([MAX_COLORS, 0]);

/**
 * @param {number} clusterSize
 * @return {Color}
 */
module.exports = function (clusterSize) {
    //reduce number of possiable colors
    return scale(Math.round(Math.log(clusterSize) / MAX_CLUSTER_SIZE_LOG * MAX_COLORS));
};

module.exports.MAX_CLUSTER_SIZE = MAX_CLUSTER_SIZE;
