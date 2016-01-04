/**
 * view model for map
 * @module components/map/model
 */

var Model = require('backbone-model').Model;

var MapModel = Model.extend({
    defaults: {
        allVenues: false,
        streets: false,
        clusters: false
    }
});
module.exports = new MapModel();
