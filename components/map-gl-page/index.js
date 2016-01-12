/**
 * @file enter point for client side mapboxgsl
 */

var ReactDOM = require('react-dom');
var map = require('../map-gl');

require('./index.less');

var appHolder = document.createElement('span');
var body = document.getElementsByTagName('body')[0];
body.appendChild(appHolder);
ReactDOM.render(map(null), appHolder);
