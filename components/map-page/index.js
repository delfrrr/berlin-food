/**
 * @module components/map-page
 */

var ReactDOM = require('react-dom');
var map = require('../map');

require('./index.less');

var appHolder = document.createElement('span');
var body = document.getElementsByTagName('body')[0];
body.appendChild(appHolder);
ReactDOM.render(map(null), appHolder);
