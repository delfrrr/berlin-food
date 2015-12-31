/**
 * @file cluster by network
 */

'strict mode';

var turf = require('turf');
var program = require('commander');
var Mongo = require('schema-check-mongo-wrapper');
var connection = new Mongo.Connection('mongodb://localhost:27017/foursqare');
var collection = connection.collection('venues');
// var chroma = require('chroma-js');
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
    .option('--dry [boolean]', 'do not output json', false)
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

var nodePoints = {};

var nodePointsAr = [];

/**
 * @type {Object.<Way.id, Point[]>}
 */
var waysNodePoints = nodesAndWays.ways.reduce(function (waysNodePoints, way) {
    var points = way.nodes.map(function (id) {
        var node = nodesById[id];
        var point = nodePoints[id];
        if (!point) {
            point = turf.point([node.lon, node.lat], {
               node: node,
               inject: []
            });
            nodePoints[id] = point;
            nodePointsAr.push(point);
        }

        return point;
    });
    waysNodePoints[way.id] = points;
    return waysNodePoints;
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
 * @param {Object} props
 * @return {LineString}
 */
function wayToline(way, props) {
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
        'properties': {
            venue: venue
        },
        'geometry': {
            'type': 'Point',
            'coordinates': [location.lng, location.lat]
        }
    };
}

/**
 * @param {LineString[]} lines
 * @param {Venue[]} venues
 */
function appendVenuesToNodePoints(lines, venues) {
    venues.forEach(function (venue) {
        if (program.filter && !venue.name.match(program.filter)) {
            return;
        }
        var venuePoint = getVenuePoint(venue);
        var minDistance = +Infinity;
        var closestPointOnLine = null;
        var closestLine = null;
        lines.forEach(function (line) {
            var pointOnLine = turf.pointOnLine(line, venuePoint);
            var distance = turf.distance(venuePoint, pointOnLine);
            //TODO: to find closest named street we can use buildings data
            if (distance < minDistance) {
                minDistance = distance;
                closestLine = line;
                closestPointOnLine = pointOnLine;
            }
        });
        var way = closestLine.properties.way;
        var bearings = closestLine.geometry.coordinates.map(function (coordinates) {
            return turf.point(coordinates);
        }).map(function (point) {
            return turf.bearing(point, closestPointOnLine);
        });
        //case of closest point === point on line
        var insertIndex = bearings.indexOf(0);
        if (insertIndex < 0) {
            var bearingsChange = bearings.map(function (angle, k, bearing) {
                if (k < bearing.length - 1) {
                    var nextAngle = bearing[k+1];
                    return Math.round(Math.abs(((360 + angle)%360) - ((360 + nextAngle)%360)));
                }
            });
            insertIndex = bearingsChange.indexOf(180);
        }
        waysNodePoints[way.id][insertIndex].properties.inject.push(closestPointOnLine);
        closestPointOnLine.properties.way = way;
        closestPointOnLine.properties.venue = venue;
    });
}

/**
 * @param {Points} venuePoints will be modified
 * @returns  {Object.<Way.id, Points[]>}
 */
function getExtendedWayPoints(venuePoints) {
    return nodesAndWays.ways.reduce(function (wayPoints, way) {
        var points = [];
        waysNodePoints[way.id].forEach(function (nodePoint) {
            //points for this way
            var nodeVenuePoints = nodePoint.properties.inject.filter(function (venuePoint) {
                return venuePoint.properties.way.id === way.id;
            });
            //sort by distance
            nodeVenuePoints.sort(function (p1, p2) {
                var d1 = turf.distance(p1, nodePoint);
                var d2 = turf.distance(p2, nodePoint);
                return  d1 - d2;
            });
            points.push(nodePoint);
            if (nodeVenuePoints.length) {
                points.push.apply(points, nodeVenuePoints);
                venuePoints.push.apply(venuePoints, nodeVenuePoints);
            }
        });
        wayPoints[way.id] = points;
        return wayPoints;
    }, {})
}

/**
 * @param  {Object.<Way.id, Points[]>} wayPoints with venue points
 * @return {LineString[]}
 */
function getExtendedLines(wayPoints) {
    return nodesAndWays.ways.map(function (way) {
        var geometries = wayPoints[way.id].map(function (point) {
            return point.geometry.coordinates;
        });
        return turf.linestring(geometries, {
            way: way
        });
    });
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
    var lines = nodesAndWays.ways.map(function (way) {
        return wayToline(way, {});
    });
    appendVenuesToNodePoints(lines, venues)

    /**
     * @type {Point[]} line points nearest to venue
     */
    var venuePoints = [];

    /**
     * @type {Object.<Way.id, Points[]>} way nodes with venue points
     */
    var wayPoints = getExtendedWayPoints(venuePoints);

    var extendedLines = getExtendedLines(wayPoints);

    var features = [].concat(venuePoints, nodePointsAr, extendedLines);

    if (!program.dry) {
        console.log(JSON.stringify(turf.featurecollection(features)));
    }
}).done(function () {
    process.exit(0);
});
