/**
 * @module view-model
 */

var Model = require('backbone-model').Model;

/**
 * @type {Model}
 */
var model = new Model({
    selectedVenueTarget: null
});

module.exports = model;
