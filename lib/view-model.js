/**
 * @module view-model
 */

var Model = require('backbone-model').Model;

/**
 * @type {Model}
 */
var model = new Model({
    selectedClusterTarget: null,
    selectedVenueTarget: null,
    selectedClusterPosition: null,
    selectedVenuePosition: null,
    maxUserCount: 1,
    venuesByClusterId: null
});

module.exports = model;
