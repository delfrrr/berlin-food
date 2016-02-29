/**
 * @file enter point for client side mapboxgsl
 */

var ReactDOM = require('react-dom');
var map = require('../map-gl');
var _  = require('lodash');

require('./index.less');

var appHolder = document.createElement('span');

//becouse we putted scripts into the head
window.addEventListener('load', _.once(function () {
    var body = document.getElementsByTagName('body')[0];
    body.appendChild(appHolder);
    ReactDOM.render(map(null), appHolder);
}));
