/**
 * @file cluster by network
 */

var turf = require('turf');
var program = require('commander');
var Mongo = require('schema-check-mongo-wrapper');
var connection = new Mongo.Connection('mongodb://localhost:27017/foursqare');
var collection = connection.collection('venues');

/**
 * callback for program.option
 */
function list(s) {
    return s.split(',').map(Number);
}

program
    .option('--bbox <items>', 'Venues bbox, lat, lng', list)
    .option('--ways [string]', 'json with ways exported from OSM', String)
    .description('clusters venues');

program.parse(process.argv);

var elements = require(process.cwd() + '/' + program.ways).elements;

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

var nodesById = nodesAndWays.nodes.reduce(function (nodesById, node) {
    nodesById[node.id] = node;
    return nodesById;
}, {});

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
 * @return {LineString}
 */
function wayToPolyLine(way) {
    return turf.linestring(way.nodes.map(function (nodeId) {
        var node = nodesById[nodeId];
        return [node.lon, node.lat];
    }));
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
    console.log(wayToPolyLine(nodesAndWays.ways[0]));
}).done(function () {
    process.exit(0);
});
