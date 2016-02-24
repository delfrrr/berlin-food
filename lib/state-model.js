/**
 * state which would be saved in local storage
 * @module state-model
 */

var LOCAL_STORAGE_KEY = 'STATE_MODEL';
/**
 * @const Berlin bbox
 */
var BBOX = [
    [13.247178093419942, 52.38029861450195],
    [13.519765, 52.65529274940338]
];
var DEFAULT_STATE = {
    zoom: 12,
    center: [
        (BBOX[0][0] + BBOX[1][0]) / 2, //LON
        (BBOX[0][1] + BBOX[1][1]) / 2 //LAT
    ]
}
var localStorageObj = {};
var localStorageStr = localStorage.getItem(LOCAL_STORAGE_KEY);
var _ = require('lodash');

if (localStorageStr) {
    try {
        localStorageObj = JSON.parse(localStorageStr);
    } catch (e) {
        setTimeout(function () {
            throw e;
        });
    }
}
/**
 * backbone model
 * @class
 */
var Model = require('backbone-model').Model.extend({

    defaults: _.defaults({}, localStorageObj, DEFAULT_STATE),

    /**
     * @override
     */
    initialize: function () {
        this.on('change', function () {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.toJSON()));
        }, this);
    }
});


module.exports = new Model();

module.exports.BBOX = BBOX;
