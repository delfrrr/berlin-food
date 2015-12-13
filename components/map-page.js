/**
 * @module components/map-page
 */

var ReactDOM = require('react-dom');
var map = require('./map');

//workaround for mounting component into body without dump elements
var appHolder = document.createElement('div');
var body = document.getElementsByTagName('body')[0];
ReactDOM.render(map(null), appHolder);
body.appendChild(appHolder.firstChild);
