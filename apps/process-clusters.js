/**
 * @file process clusters, agregade stats
 */

'use strict';

var program = require('commander');
var turf = require('turf');
var fs = require('fs');
var _ = require('lodash');


program
    .option('--clusters [string]', 'geojson with clusters', String)
    .option('--out [string]', 'output folder', String)
    .option('--prefix [string]', 'output file prefix', 'processed.')
    .option('--dry [boolean]', 'do not output json', false)
    .description('process clusters, agregade stats');

program.parse(process.argv);

/**
 * which is estimated quality of venue which coul be found
 * @param {Object.<Venue.rating, Number>} ratingCounts
 * @return {Number}
 */
function getClusterRating(ratingCounts) {
    var pAr = [];
    _.forIn(ratingCounts, function (count, rating) {
        pAr.push(Number(rating) * (1 - Math.pow(0.5, count)));
    });
    return Number(Math.max.apply(Math, pAr).toFixed(1)) || 0;
}

/**
 * @param {Point[]} venuePoints
 * @return {Object.<Venue.rating, Number>} counts by rating
 */
function getRatingCounts(venuePoints) {
    return _.countBy(venuePoints.filter(function (p) {
        //we suppose that unrated has same distribution
        return p.properties.venue.rating;
    }), function (p) {
        return Math.floor(p.properties.venue.rating);
    });
}

/**
 * @type {Point[]}
 */
var clusters = require(process.cwd() + '/' + program.clusters).features;

//smaller cluster should appear on top
clusters.sort(function (c1, c2) {
    return c2.properties.radius - c1.properties.radius;
});

/**
 * @type {Point[]}
 */
var venues = [];

/**
 * @type {Point[]}
 */
var streets = [];

clusters.forEach(function (clusterPoint) {
    var clusterId = clusterPoint.properties.clusterId;
    var clusterSize = clusterPoint.properties.venuePoints.length;
    var ratingCounts = getRatingCounts(clusterPoint.properties.venuePoints);
    clusterPoint.properties.venuePoints.forEach(function (p) {
        p.properties.clusterId = clusterId;
        venues.push(p);
    });
    clusterPoint.properties.streetLines.forEach(function (p) {
        p.properties.clusterId = clusterId;
        streets.push(p);
    });
    clusterPoint.properties = {
        clusterId: clusterId,
        ratingCounts: ratingCounts,
        clusterRating: getClusterRating(ratingCounts),
        bbox: clusterPoint.properties.bbox,
        radius: clusterPoint.properties.radius, //km
        clusterSize: clusterSize //number of venues
    }
});

console.log('clusters', clusters.length);
console.log('venues', venues.length);
console.log('streets', streets.length);

var folder = process.cwd() + '/' + program.out;

console.log(folder + '/' + program.prefix + 'clusters.json');
console.log(folder + '/' + program.prefix + 'venues.json');
console.log(folder + '/' + program.prefix + 'streets.json');

if (!program.dry) {
    fs.writeFileSync(folder + '/' + program.prefix + 'clusters.json', JSON.stringify(turf.featurecollection(clusters)));
    fs.writeFileSync(folder + '/' + program.prefix + 'venues.json', JSON.stringify(turf.featurecollection(venues)));
    fs.writeFileSync(folder + '/' + program.prefix + 'streets.json', JSON.stringify(turf.featurecollection(streets)));
}
