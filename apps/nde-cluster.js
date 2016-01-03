/**
 * @file cluster by network
 */

'strict mode';

var turf = require('turf');
var program = require('commander');
var Mongo = require('schema-check-mongo-wrapper');
var connection = new Mongo.Connection('mongodb://localhost:27017/foursqare');
var collection = connection.collection('venues');
var sphereKnn = require('sphere-knn');
var _ = require('lodash');

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
    .option('--tolerance [number]', 'distance tolerance, meters', Number, 100)
    .option('--rating [number]', 'minimal rating', Number, 0)
    .description('clusters venues');

program.parse(process.argv);

var R = 6371;//km
var DEG_RAD = Math.PI / 180;
var LAT_COS = Math.cos((program.bbox[0] + program.bbox[2]) / 2 * DEG_RAD);

function fastDistance(p1, p2) {
    var g1 = p1.geometry.coordinates;
    var g2 = p2.geometry.coordinates;
    var x = (g1[0] - g2[0]) * LAT_COS * DEG_RAD;
    var y = (g1[1] - g2[1]) * DEG_RAD;
    return Math.sqrt(x * x + y * y) * R;
}


if (program.dry) {
    console.log('tolerance', program.tolerance);
    console.time('total');
}

var elements = require(process.cwd() + '/' + program.ways).elements;

if (program.dry) {
    console.time('nodesAndWays');
}
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
if (program.dry) {
    console.timeEnd('nodesAndWays');
}

if (program.dry) {
    console.time('nodesById');
}

/**
 * @type {Object.<Node.id, Node>}
 */
 var nodesById = nodesAndWays.nodes.reduce(function (nodesById, node) {
     nodesById[node.id] = node;
     return nodesById;
 }, {});

if (program.dry) {
    console.timeEnd('nodesById');
}

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
               inject: [],
               ways: [way.id],
               density: 0
            });
            nodePoints[id] = point;
            nodePointsAr.push(point);
        } else {
            point.properties.ways.push(way.id)
        }
        return point;
    });
    waysNodePoints[way.id] = points;
    return waysNodePoints;
}, {});

var lookup = sphereKnn(nodePointsAr.map(function (point) {
    var coordinates = point.geometry.coordinates;
    return {
        lon: coordinates[0],
        lat: coordinates[1],
        ways: point.properties.ways
    }
}));

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
 * @param {Venue} venue
 * @returns {Number} density
 */
function getVenueDensity(venue) {
    var rating = venue.rating || 5;
    return 0.25 + (rating - 5) * 0.75 / 5;
}

/**
 * @param {Object.<Way.id, LineString>} linesById
 * @param {Venue[]} venues
 */
function appendVenuesToNodePoints(linesById, venues) {
    venues.forEach(function (venue) {
        if (program.filter && !venue.name.match(program.filter)) {
            return;
        }
        var venuePoint = getVenuePoint(venue);
        var minDistance = +Infinity;
        var closestPointOnLine = null;
        var closestLine = null;
        //TODO: not really fair to look for closest not, not for closest point on line
        var lookupPoints = lookup(
            venuePoint.geometry.coordinates[1],
            venuePoint.geometry.coordinates[0],
            +Infinity,
            300
        );
        var lookupLines = _.uniq([].concat.apply([], lookupPoints.map(function (p) {
            return p.ways;
        }))).map(function (wayId) {
            return linesById[wayId];
        })
        lookupLines.forEach(function (line) {
            var pointOnLine = turf.pointOnLine(line, venuePoint);
            var distance = fastDistance(venuePoint, pointOnLine);
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
        closestPointOnLine.properties.ways = [way.id];
        closestPointOnLine.properties.venue = venue;
        closestPointOnLine.properties.density = getVenueDensity(venue);
    });
}

/**
 * @param {Point} from
 * @param {Point} to
 * @return {Number} density
 */
function getDensity(from, to) {
    if (from.properties.density) {
        var distance = fastDistance(from, to) * 1000;
        var density = from.properties.density - distance / program.tolerance;
        if (density < 0) {
            density = 0;
        }
        return density;
    } else {
        return 0;
    }
}

/**
 * @param {Point} p1
 * @param {Point} p2
 * @return {Boolean} is connected
 */
function pointsConected(p1, p2) {
    var density = Math.max(p1.properties.density + p2.properties.density);
    var distance = fastDistance(p1, p2) * 1000;
    return density * program.tolerance >= distance;
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
                var d1 = fastDistance(p1, nodePoint);
                var d2 = fastDistance(p2, nodePoint);
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

/**
 * @param {Object.<Way.id, Points[]>} wayPoints
 */
function propagateDensity(wayPoints) {
    var changed = true;
    while (changed) {
        changed = false;
        nodesAndWays.ways.map(function (way) {
            wayPoints[way.id].forEach(function (point, i, points) {
                var next = points[i+1];
                if (next) {
                    var fromNext = getDensity(next, point);
                    var toNext = getDensity(point, next);
                    if (fromNext > point.properties.density) {
                        point.properties.density = fromNext;
                        changed = true;
                    } else if (toNext > next.properties.density) {
                        next.properties.density = toNext;
                        changed = true;
                    }
                }
            });
        });
    }
}

/**
 * @param {Object.<Way.id, Points[]>} wayPoints
 */
function cluster(wayPoints) {
    var lastClusterId = 0;
    /**
     * @type {Array.<[cid, cid]>}
     */
    var clusterLinks = [];

    /**
     * @type {cid[]}
     */
    var clusterIds = [];
    if (program.dry) {
        console.time('find groups by streets');
    }
    //find groups by streets
    Object.keys(wayPoints).forEach(function (wayId) {
        var wayPointsAr = wayPoints[wayId];
        wayPointsAr.forEach(function (point, i) {
            if (point.properties.density > 0) {
                var prevPoint = i && wayPointsAr[i - 1];
                if (
                    prevPoint &&
                    prevPoint.properties.clusterId &&
                    pointsConected(point, prevPoint)
                ) {
                    if (point.properties.clusterId) {
                        clusterLinks.push([
                            point.properties.clusterId,
                            prevPoint.properties.clusterId
                        ])
                    } else {
                        point.properties.clusterId = prevPoint.properties.clusterId;
                    }
                } else if (!point.properties.clusterId) {
                    point.properties.clusterId = ++lastClusterId;
                    clusterIds.push(point.properties.clusterId);
                }
            }
        });
    });

    if (program.dry) {
        console.timeEnd('find groups by streets');
    }

    var uncheckedGroups = clusterIds.map(function (clusterId) {
        return [clusterId];
    }).concat(clusterLinks);

    var checkedGroups = [];

    /**
     * @type {Object.<cid, gid>}
     */
    var clusterToGroup = {};

    // var i = 0;

    if (program.dry) {
        console.time('group clusters');
    }
    //group clusters
    var g;
    while (uncheckedGroups.length) {
        g = uncheckedGroups.pop();
        if (!uncheckedGroups.some(function (cg, k) {
            if (cg.some(function (cid) {
                return g.indexOf(cid) >= 0;
            })) {
                uncheckedGroups[k] = _.uniq([].concat(cg, g));
                return true;
            }
        })) {
            g.forEach(function (cid) {
                clusterToGroup[cid] = checkedGroups.length;
            });
            checkedGroups.push(g);

        }
    }
    if (program.dry) {
        console.timeEnd('group clusters');
        console.log('clusterGroups', checkedGroups.length);
    }

    if (program.dry) {
        console.time('assign group ids');
    }
    //assign group ids
    Object.keys(wayPoints).forEach(function (wayId) {
        var wayPointsAr = wayPoints[wayId];
        wayPointsAr.forEach(function (point) {
            if (point.properties.clusterId) {
                point.properties.groupId = clusterToGroup[point.properties.clusterId];
            }
        });
    });
    if (program.dry) {
        console.timeEnd('assign group ids');
    }
}

var conditions = [
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
];

if (program.rating) {
    conditions.push({
        'rating': {
            $gte: program.rating
        }
    });
}

collection.find({
    $and: conditions
}).toArray().then(function (venues) {
    var linesById = nodesAndWays.ways.reduce(function (linesById, way) {
        linesById[way.id] = wayToline(way, {});
        return linesById;
    }, {});
    if (program.dry) {
        console.time('appendVenuesToNodePoints');
    }
    appendVenuesToNodePoints(linesById, venues)
    if (program.dry) {
        console.timeEnd('appendVenuesToNodePoints');
    }

    /**
     * @type {Point[]} line points nearest to venue
     */
    var venuePoints = [];

    /**
     * @type {Object.<Way.id, Points[]>} way nodes with venue points
     */
    var wayPoints = getExtendedWayPoints(venuePoints);

    var extendedLines = getExtendedLines(wayPoints);

    if (program.dry) {
        console.time('propagateDensity');
    }

    propagateDensity(wayPoints);

    if (program.dry) {
        console.timeEnd('propagateDensity');
    }

    if (program.dry) {
        console.time('cluster');
    }

    cluster(wayPoints);

    if (program.dry) {
        console.timeEnd('cluster');
    }


    if (program.dry) {
        console.timeEnd('total');
    }

    var features = [].concat(venuePoints);

    if (!program.dry) {
        console.log(JSON.stringify(turf.featurecollection(features)));
    }
}).done(function () {
    process.exit(0);
});
