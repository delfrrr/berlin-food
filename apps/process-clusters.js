/**
 * @file process clusters, agregade stats
 */

'use strict';

var program = require('commander');
var turf = require('turf');
var fs = require('fs');
var _ = require('lodash');
var maxClusterSize = 0;


program
    .option('--clusters [string]', 'geojson with clusters', String)
    .option('--out [string]', 'output folder', String)
    .option('--prefix [string]', 'output file prefix', 'processed.')
    .option('--dry [boolean]', 'do not output json', false)
    .option('--rating [number]', 'minimal cluster rating', 4)
    .description('process clusters, agregate stats');

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
 * @param {Point[]} venuePoints
 * @return {Object.<Venue.rating, {total: number, prices: Object.<Venue.price.tier, Number>}>}
 */
function getPriceByRating(venuePoints) {
    var venuesByRating =  _.groupBy(venuePoints.filter(function (p) {
        return p.properties.venue.rating && p.properties.venue.price;
    }), function (p) {
        return Math.floor(p.properties.venue.rating);
    });
    var pricesByRating = Object.keys(venuesByRating).reduce(function (pricesByRating, rating) {
        var venuePoints = venuesByRating[rating];
        pricesByRating[rating] = {
            total: venuePoints.length,
            prices: _.countBy(venuePoints, function (p) {
                return p.properties.venue.price.tier;
            })
        };
        return pricesByRating;
    }, {});
    return pricesByRating;
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

/**
 * @typedef {Object} FoodCategoryItem
 * @prop {Number} rating
 * @prop {Number} count
 * @prop {VenueCategory} category
 */

/**
 * @param {Point[]} venuePoints
 * @return {FoodCategoryItem[]}
 */
function getFoodRatings(venuePoints) {
    /**
     * @type {Object.<VenueCategory.id, VenueCategory>}
     */
    var categoriesById = {};
    /**
     * @type {Object.<VenueCategory.id, Point>}
     */
    var venuePointsByCategoryId = {};

    venuePoints.forEach(function (vp) {
        var category = vp.properties.venue.categories && vp.properties.venue.categories[0];
        if (category) {
            categoriesById[category.id] = category;
            venuePointsByCategoryId[category.id] = (venuePointsByCategoryId[category.id] || []).concat([vp]);
        }
    });

    var categories = Object.keys(categoriesById).map(function (categoryId) {
        return {
            rating: getClusterRating(getRatingCounts(venuePointsByCategoryId[categoryId])),
            category: categoriesById[categoryId],
            count: venuePointsByCategoryId[categoryId].length
        }
    }).sort(function (c1, c2) {
        return c2.rating - c1.rating;
    }).slice(0, 5);

    return categories;
}

allClusters.forEach(function (clusterPoint) {
    var clusterId = clusterPoint.properties.clusterId;
    var clusterSize = clusterPoint.properties.venuePoints.length;
    if (maxClusterSize < clusterSize) {
        maxClusterSize = clusterSize;
    }
    var ratingCounts = getRatingCounts(clusterPoint.properties.venuePoints);
    var clusterRating = getClusterRating(ratingCounts);
    if (clusterRating < program.rating) {
        return;
    }
    var priceByRating = getPriceByRating(clusterPoint.properties.venuePoints);
    var foodRatings = getFoodRatings(clusterPoint.properties.venuePoints);

    clusterPoint.properties.venuePoints.forEach(function (p) {
        p.properties.clusterId = clusterId;
        p.properties.clusterRating = clusterRating;
        p.properties.clusterSize = clusterSize;
        p.properties.venueId = p.properties.venue.id;
        p.properties.name = p.properties.venue.name;
        venues.push(p);
    });
    if (clusterPoint.properties.radius) {
        clusterPoint.properties.streetLines.forEach(function (p) {
            p.properties.streetId = [clusterId, p.properties.way.id].join('-');
            p.properties.clusterId = clusterId;
            p.properties.clusterRating = clusterRating;
            p.properties.clusterSize = clusterSize;
            streets.push(p);
        });
    }
    clusterPoint.properties = {
        clusterId: clusterId,
        foodRatings: foodRatings,
        clusterRating: clusterRating,
        bbox: clusterPoint.properties.bbox,
        radius: clusterPoint.properties.radius, //km
        clusterSize: clusterSize, //number of venues
        priceByRating: priceByRating
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
console.log('maxClusterSize', maxClusterSize);

var folder = process.cwd() + '/' + program.out;

console.log(folder + '/' + program.prefix + 'clusters.json');
console.log(folder + '/' + program.prefix + 'venues.json');
console.log(folder + '/' + program.prefix + 'streets.json');

if (!program.dry) {
    fs.writeFileSync(folder + '/' + program.prefix + 'clusters.json', JSON.stringify(turf.featurecollection(clusters)));
    fs.writeFileSync(folder + '/' + program.prefix + 'venues.json', JSON.stringify(turf.featurecollection(venues)));
    fs.writeFileSync(folder + '/' + program.prefix + 'streets.json', JSON.stringify(turf.featurecollection(streets)));
}
