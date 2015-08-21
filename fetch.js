/**
 * fetch data from fousquare
 */

/**
 * @typedef {array} ll
 * @prop {number} 0 lat
 * @prop {number} 0 lng
 */

/**
 * @typedef {object} geojson
 * @see http://geojson.org/geojson-spec.html
 */

var program = require('commander'),
    packagejson = require('./package.json'),
    csv = require('to-csv'),
    turf = require('turf');

program
    .version(packagejson.version)
    .option('-r, --radius [number]', 'Radius km', Number, 1)
    .description('fetch data from fousquare');
program.parse(process.argv);

var CLIENT_ID = '3S4FSCICKVNFXZ2EUKRV0LIL3TS3B1JMEOXTSEVNSE1KAFWU',
    CLIENT_SECRET = '3S4FSCICKVNFXZ2EUKRV0LIL3TS3B1JMEOXTSEVNSE1KAFWU',
    centerLl = [52.516667, 13.383333],
    radius = program.radius * 1000;//m


var axis1 = [];
var axis2 = [];

/**
 * get line geojson
 * @param {ll[]} coordinates
 * @return {geojson} coordinates
 */
function getLineByCoords(coordinates) {
    return {
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates: coordinates
        }
    };
}

/**
 * @param {array<{ll}>} collection
 * @param {geojson} line
 * @param {number} radius m
 * @param {number} distance m
 */
function walk(collection, line, radius, distance) {
    distance = distance || 0;
    distance += 250;
    var along = turf.along(line, distance / 1000, 'kilometers');
    collection.push(along.geometry.coordinates);
    if (distance < radius) {
        walk(collection, line, radius, distance);
    }
}

walk(axis1, getLineByCoords([centerLl, [centerLl[0], 0]]), radius);
walk(axis1, getLineByCoords([centerLl, [centerLl[0], 90]]), radius);
walk(axis2, getLineByCoords([centerLl, [0, centerLl[1]]]), radius);
walk(axis2, getLineByCoords([centerLl, [90, centerLl[1]]]), radius);

var net = [];
axis1.forEach(function (ll) {
    var lng = ll[1];
    axis2.forEach(function (ll) {
        var lat = ll[0];
        net.push([lat, lng]);
    });
});
console.log('net length %j', net.length);
