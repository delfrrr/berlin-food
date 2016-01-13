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
            var R = 6371;//km
            var SAMPLE_ZOOM = component._map.getZoom();
            var p0 = component._map.project([0, 0]);
            var p1 = component._map.project([1, 1]);
            //TODO: not relly prceid, try current position and then COS
            var SAMPLE_PIXEL_TO_DEG = p1.x - p0.x;
            var PIXEL_TO_KM = SAMPLE_PIXEL_TO_DEG * 180 / Math.PI / R  / Math.pow(2, SAMPLE_ZOOM);
            var ZOOM_SCALES = _.range(1, 20).map(function (zoom) {
                return [zoom, PIXEL_TO_KM * Math.pow(2, zoom)];
            });

            component._map.batch(function (batch) {
                clusterPoints.forEach(function (cp) {
                    var clusterId = cp.properties.clusterId;
                    if (cp.properties.radius) {
                        batch.addLayer({
                            id: 'cluster-' + clusterId,
                            source: 'clusters',
                            type: 'circle',
                            paint: {
                                'circle-color': clusterColor(clusterId),
                                'circle-radius': {
                                    base: 2,
                                    stops: ZOOM_SCALES.map(function (stop) {
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
