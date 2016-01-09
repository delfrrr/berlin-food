/**
 * @file process clusters, agregade stats
 */


var program = require('commander');
var turf = require('turf');
var fs = require('fs');


program
    .option('--clusters [string]', 'geojson with clusters', String)
    .option('--out [string]', 'output folder', String)
    .option('--prefix [string]', 'output file prefix', 'processed.')
    .option('--dry [boolean]', 'do not output json', false)
    .description('process clusters, agregade stats');

program.parse(process.argv);

/**
 * @type {Point[]}
 */
var clusters = require(process.cwd() + '/' + program.clusters).features;

/**
 * @type {Point[]}
 */
var venues = [];

/**
 * @type {Point[]}
 */
var streets = [];

clusters.forEach(function (clusterPoint) {
    [].push.apply(venues, clusterPoint.properties.venuePoints);
    [].push.apply(streets, clusterPoint.properties.streetLines);
    clusterPoint.properties = {
        clusterId: clusterPoint.properties.clusterId,
        bbox: clusterPoint.properties.clusterId,
        radius: clusterPoint.properties.radius, //km
        venuesCount: clusterPoint.properties.venuePoints.length
    }
});

if (program.dry) {
    console.log('clusters', clusters.length);
    console.log('venues', venues.length);
    console.log('streets', streets.length);
}

var folder = process.cwd() + '/' + program.out;

if (!program.dry) {
    fs.writeFileSync(folder + '/' + program.prefix + 'clusters.json', JSON.stringify(turf.featurecollection(clusters)));
    fs.writeFileSync(folder + '/' + program.prefix + 'venues.json', JSON.stringify(turf.featurecollection(venues)));
    fs.writeFileSync(folder + '/' + program.prefix + 'streets.json', JSON.stringify(turf.featurecollection(streets)));
} else {
    console.log(folder + '/' + program.prefix + 'clusters.json');
    console.log(folder + '/' + program.prefix + 'venues.json');
    console.log(folder + '/' + program.prefix + 'streets.json');
}
