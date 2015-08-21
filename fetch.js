/**
 * fetch data from fousquare
 */

var program = require('commander'),
    packagejson = require('./package.json'),
    csv = require('to-csv'),
    turf = require('turf'),
    CLIENT_ID = '3S4FSCICKVNFXZ2EUKRV0LIL3TS3B1JMEOXTSEVNSE1KAFWU',
    CLIENT_SECRET = '3S4FSCICKVNFXZ2EUKRV0LIL3TS3B1JMEOXTSEVNSE1KAFWU',
    centerLl = [52.516667, 13.383333],
    radius = 20 * 1000;//m

program
    .version(packagejson.version)
    .description('fetch data from fousquare');
program.parse(process.argv);

var axis1 = [];
var axis2 = [];

function getLineByCoords(coordinates) {
    return {
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates: coordinates
        }
    };
}

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

var cells = [];
axis1.forEach(function (ll) {
    var lng = ll[1];
    axis2.forEach(function (ll) {
        var lat = ll[0];
        cells.push({
            lat: lat,
            lng: lng,
            value: 1
        });
    });
});
console.log(csv(cells));
