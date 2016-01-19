/**
 * @module view-model
 */

var Model = require('backbone-model').Model;

/**
 * @type {Model}
 */
var model = new Model({
    selectedVenueId: null
});

module.exports = model;
