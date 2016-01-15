/**
 * controller for webg map
 * @module map-gl
*/

var React = require('react');
var mapboxgl = require('mapboxgl');
var clusters = require('./clusters');
var venues = require('./venues');
require('./index.less');

module.exports = React.createFactory(React.createClass({

componentDidMount: function () {
    var zoom = Math.floor(Number(localStorage.getItem('zoom')));
    var component = this;
    var center = [
        Number(localStorage.getItem('lng')),
        Number(localStorage.getItem('lat'))
    ];
    this._map = new mapboxgl.Map({
        container: this.refs.mapNode,
        style: 'mapbox://styles/mapbox/streets-v8',
        center: center,
        zoom: zoom
    });

    this._map.on('moveend', this._onMapChange);
    this._map.on('zoomend', this._onMapChange);

    var mapPromise = new Promise(function (resolve) {
        component._map.on('load', function () {
            //TODO: remove permanently from style
            component._map.removeLayer('poi-scalerank4-l1');
            resolve(component._map);
        });
    });

    clusters(mapPromise);
    venues(mapPromise);
},

_onMapChange: function () {
    var center = this._map.getCenter();
    localStorage.setItem('zoom', this._map.getZoom());
    localStorage.setItem('lat', center.lat);
    localStorage.setItem('lng', center.lng);
},

render: function () {
     return React.DOM.div(
         {
             className: 'map'
         },
         React.DOM.div({
             className: 'map__map-node',
             ref: 'mapNode'
         })
     );
 }
}));
