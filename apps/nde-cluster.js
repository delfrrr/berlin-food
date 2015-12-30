/**
 * @file cluster by network
 */

var turf = require('turf');
var program = require('commander');
var Mongo = require('schema-check-mongo-wrapper');
var connection = new Mongo.Connection('mongodb://localhost:27017/foursqare');
var collection = connection.collection('venues');
var chroma = require('chroma-js');

/**
 * callback for program.option
 */
function list(s) {
    return s.split(',').map(Number);
}

program
    .option('--bbox <items>', 'Venues bbox, lat, lng', list)
    .option('--ways [string]', 'json with ways exported from OSM', String)
    .option('--filter [string]', 'filter by venue name', null)
    .description('clusters venues');

program.parse(process.argv);

var elements = require(process.cwd() + '/' + program.ways).elements;

/**
 * @type {nodes: Node[], ways: Way[]}
 */
var nodesAndWays = elements.reduce(function (nodesAndWays, element) {
    if (element.type === 'node') {
        nodesAndWays.nodes.push(element);
    } else if (element.type === 'way') {
        nodesAndWays.ways.push(element);
    }
    return nodesAndWays;
}, {
    nodes: [],
    ways: []
});

/**
 * @type {Object.<Node.id, Node>}
 */
 var nodesById = nodesAndWays.nodes.reduce(function (nodesById, node) {
     nodesById[node.id] = node;
     return nodesById;
 }, {});

 /**
  * @type {Object.<Way.id, Way>}
  */
// var waysById = nodesAndWays.ways.reduce(function (wbd, way) {
//     wbd[way.id] = way;
//     return wbd;
// }, {});

/**
 * Osm json element
 * @typedef {Object} OsmElem
 * @prop {string} type
 * @prop {string} id
 */

/**
 * Osm node
 * @typedef {OsmElem} Node
 * @prop lat
 * @prop lon
 */

/**
 * Osm way
 * @typedef {OsmElem} Way
 * @prop {OsmElem.id[]} nodes
 */

/**
 * @param {Way} way
 * @param {Object} props
 * @return {LineString}
 */
function wayToPolyLine(way, props) {
    props.way = way;
    return turf.linestring(way.nodes.map(function (nodeId) {
        var node = nodesById[nodeId];
        return [node.lon, node.lat];
    }), props);
}

/**
 * @param {Venue} venue
 * @return {Point}
 */
function getVenuePoint(venue) {
    var location = venue.location;
    return {
        'type': 'Feature',
        'properties': {},
        'geometry': {
            'type': 'Point',
            'coordinates': [location.lng, location.lat]
        }
    };
}

collection.find({
    $and: [
        {'location.lat': {
            $gte: program.bbox[0]
        }},
        {'location.lat': {
            $lte: program.bbox[2]
        }},
        {'location.lng': {
            $gte: program.bbox[1]
        }},
        {'location.lng': {
            $lte: program.bbox[3]
        }}
    ]
}).toArray().then(function (venues) {
    var colors = chroma
        .cubehelix()
        .scale()
        .correctLightness()
        .colors(100);
    var polylines = nodesAndWays.ways.map(function (way) {
        return wayToPolyLine(way, {
            stroke: colors[Math.floor(Math.random() * 100)]
        });
    });
    var features = [];
    if (!program.filter) {
        features = [].concat(polylines);
    }

    venues.forEach(function (venue) {
        if (program.filter && !venue.name.match(program.filter)) {
            return;
        }
        var minDistance = +Infinity;
        var venuePoint = getVenuePoint(venue);
        var closestPointOnLine = null;
        var closestLine = null;
        polylines.forEach(function (polyline) {
            var pointOnLine = turf.pointOnLine(polyline, venuePoint);
            var distance = turf.distance(venuePoint, pointOnLine);
            if (distance < minDistance) {
                minDistance = distance;
                //TODO:building can have few edges
                closestLine = polyline;
                closestPointOnLine = pointOnLine;
            }
        });
        //TODO: elaborate insertIndex
        // var bearingsChange = closestLine.geometry.coordinates.map(function (coordinates) {
        //     return turf.point(coordinates);
        // }).map(function (point) {
        //     return turf.bearing(point, closestPointOnLine);
        // }).map(function (angle, k, bearing) {
        //     if (k < bearing.length - 1) {
        //         var nextAngle = bearing[k+1];
        //         return Math.round(Math.abs(((360 + angle)%360) - ((360 + nextAngle)%360)));
        //     }
        // });
        // var insertIndex = bearingsChange.indexOf(180);
        venuePoint.properties['marker-color'] = closestLine.properties.stroke;
        venuePoint.properties.title = JSON.stringify(closestLine.properties.way.tags);
        features.push(venuePoint);
        if (program.filter) {
            features.push(closestLine);
        }
    });
    console.log(JSON.stringify(turf.featurecollection(features)));
}).done(function () {
    process.exit(0);
});
