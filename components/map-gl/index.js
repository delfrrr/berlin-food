/**
 * controller for webg map
 * @module map-gl
*/

var React = require('react');
var mapboxgl = require('mapboxgl');
var clusters = require('./clusters');
var venues = require('./venues');
var streets = require('./streets');
var panel = require('../panel');
var venueLink = require('./link');
var viewModel = require('../../lib/view-model');
var clusterHighlight = require('./cluster-hilight');
var githubRibbon = React.createFactory(require('react-github-fork-ribbon'));

//default map coordinates
var BBOX = [
    [13.247178093419942, 52.38029861450195],
    [13.519765, 52.65529274940338]
];
var LON = (BBOX[0][0] + BBOX[1][0]) / 2;
var LAT = (BBOX[0][1] + BBOX[1][1]) / 2;
var ZOOM = 12;

require('./index.less');

module.exports = React.createFactory(React.createClass({

componentDidMount: function () {
    var zoom = Math.floor(Number(localStorage.getItem('zoom') || ZOOM));
    var component = this;
    var center = [
        Number(localStorage.getItem('lng') || LON),
        Number(localStorage.getItem('lat') || LAT)
    ];
    this._map = new mapboxgl.Map({
        container: this.refs.mapNode,
        style: 'mapbox://styles/delfrrr/cijgamnno000xbolxebup2s46',
        center: center,
        zoom: zoom,
        maxBounds: [
            [13.247178093419942, 52.38029861450195],
            [13.519765, 52.65529274940338]
        ]
    });

    this._map.on('moveend', this._onMapChange);
    this._map.on('zoomend', this._onMapChange);

    var mapPromise = new Promise(function (resolve) {
        component._map.on('load', function () {
            resolve(component._map);
        });
    });

    clusters(mapPromise);
    venues(mapPromise);
    streets(mapPromise);

    viewModel.on('change:selectedClusterTarget', function () {
        var clusterTarget = viewModel.get('selectedClusterTarget');
        var venueTarget = viewModel.get('selectedVenueTarget');
        var venueClusterId;
        var clusterId;
        if (venueTarget) {
            venueClusterId = venueTarget.properties.clusterId;
        }
        if (clusterTarget) {
            clusterId = clusterTarget.properties.clusterId;
        }
        if (clusterId && venueClusterId !== clusterId) {
            //means we hilighted next cluster
            viewModel.set('selectedVenueTarget', null);
        }
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
        }),
        venueLink(),
        clusterHighlight(),
        React.DOM.a(
            {
                className: 'map__powered-by-foursquare',
                target: '_blank',
                href: 'http://foursquare.com'
            }
        ),
        //TODO: add link
        githubRibbon(
            {
                position: 'right',
                color: 'black'
            },
            'Fork me on GitHub'
        ),
        React.DOM.div({className: 'map__panel-back'}),
        panel({
            className: 'map__panel'
        })
    );
 }
}));
