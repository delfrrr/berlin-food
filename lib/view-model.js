/**
 * @module view-model
 */

var Model = require('backbone-model').Model;

/**
 * @type {Model}
 */
var model = new Model({
    selectedVenueTarget: null,
    selectedVenuePosition: null,
    maxUserCount: 1
});

module.exports = model;
