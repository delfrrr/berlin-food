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
    .option('--rating [number]', 'do not output json', 4)
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
    var rating = Number(Math.max.apply(Math, pAr).toFixed(1));
    if (rating < 0) {
        rating = 0;
    }
    return  rating;
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
var allClusters = require(process.cwd() + '/' + program.clusters).features;

//smaller cluster should appear on top
allClusters.sort(function (c1, c2) {
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

/**
 * @type {Point[]}
 */
var clusters = [];

allClusters.forEach(function (clusterPoint) {
    var clusterId = clusterPoint.properties.clusterId;
    var clusterSize = clusterPoint.properties.venuePoints.length;
    var ratingCounts = getRatingCounts(clusterPoint.properties.venuePoints);
    var clusterRating = getClusterRating(ratingCounts);
    if (clusterRating < program.rating) {
        return;
    }
    clusterPoint.properties.venuePoints.forEach(function (p) {
        p.properties.clusterId = clusterId;
        p.properties.clusterRating = clusterRating;
        p.properties.venueId = p.properties.venue.id;
        p.properties.name = p.properties.venue.name;
        venues.push(p);
    });
    if (clusterPoint.properties.radius) {
        clusterPoint.properties.streetLines.forEach(function (p) {
            p.properties.streetId = [clusterId, p.properties.way.id].join('-');
            p.properties.clusterId = clusterId;
            p.properties.clusterRating = clusterRating;
            streets.push(p);
        });
    }
    clusterPoint.properties = {
        clusterId: clusterId,
        ratingCounts: ratingCounts,
        clusterRating: clusterRating,
        bbox: clusterPoint.properties.bbox,
        radius: clusterPoint.properties.radius, //km
        clusterSize: clusterSize //number of venues
    }
    clusters.push(clusterPoint)
});

//TODO: somehow we have few duplicates
venues = _.uniqBy(venues, function (vp) {
    return vp.properties.venue.id;
});

//smaller on top
venues.sort(function (p1, p2) {
    return (p2.properties.venue.rating || 0) - (p1.properties.venue.rating || 0);
})


console.log('venues', venues.length);
console.log('clusters', clusters.length);
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
