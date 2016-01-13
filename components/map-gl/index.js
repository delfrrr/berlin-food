/**
 * controller for webg map
 * @module map-gl
*/

var React = require('react');
var mapboxgl = require('mapboxgl');
var request = require('browser-request');
//TODO: move to lib
var clusterColor = require('../map/cluster-color');
var _ = require('lodash');
require('./index.less');
var scale = require('d3-scale');

/**
 * @type {Function}
 * @param {Number} clusterRating
 * @return {Number} minzoom
 */
var getMinZoomLevel = scale
    .scaleLinear()
    .domain([3, 4, 7, 7.001, 10])
    .range([16, 15, 13, 1, 1]);

var R = 6371;//km

/**
 * @param {mapboxgl.Map} map
 * @return {Array.<Array.<zoom, pixelToKm>>}
 */
function getDistanceZoomScale(map) {
    var zoom = map.getZoom();
    var center = map.getCenter().toArray();
    //in mercantor projection distanced strached by OY, so we use bigger radius
    var dy = 0.01;
    var p0 = map.project(center);
    var p1 = map.project([center[0], center[1] + dy]);
    var pixelToDeg = Math.abs((p1.y - p0.y)) / dy;
    var pixelToKm = pixelToDeg * 180 / Math.PI / R  /
        Math.pow(2, zoom) /
        Math.cos(center[0] / 180 * Math.PI);
    return _.range(1, 20).map(function (zoom) {
        return [zoom, pixelToKm * Math.pow(2, zoom)];
    });
}

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

    var ajaxLoad = new Promise(function (resolve, reject) {
        request('/geojson/processed.clusters.json', function (err, res, body) {
            if (err) {
                reject(err);
            } else {
                resolve(JSON.parse(body));
            }
        });
    });

    var distanceZoomScale = getDistanceZoomScale(this._map);

    var mapLoad = new Promise(function (resolve) {
        component._map.on('load', function () {
            resolve();
        });
    });

    Promise.all([ajaxLoad, mapLoad]).then(function (result) {
        var clusterPoints = result[0].features;
        component._map.addSource('clusters', {
            type: 'geojson',
            data: result[0]
        });

        component._map.batch(function (batch) {
            clusterPoints.forEach(function (cp) {
                var clusterId = cp.properties.clusterId;
                if (cp.properties.radius) {
                    batch.addLayer({
                        id: 'cluster-' + clusterId,
                        source: 'clusters',
                        type: 'circle',
                        minzoom: getMinZoomLevel(cp.properties.clusterRating),
                        paint: {
                            'circle-color': clusterColor(clusterId),
                            'circle-opacity': {
                                stops: [[1, 0.8], [14, 0.8], [17, 0.3], [19, 0]]
                            },
                            'circle-blur': {
                                base: 1,
                                stops: distanceZoomScale.map(function (stop) {
                                    return [stop[0], 1 / stop[1] / cp.properties.radius]
                                })
                            },
                            'circle-radius': {
                                base: 2,
                                stops: distanceZoomScale.map(function (stop) {
                                    return[stop[0], stop[1] * cp.properties.radius]
                                })
                            }
                        },
                        filter: ['==', 'clusterId', clusterId]
                    });
                }
            });
        });
    });
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
