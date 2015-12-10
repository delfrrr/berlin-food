/**
 * export data
 */

var program = require('commander'),
    packagejson = require('./package.json'),
    Mongo = require('schema-check-mongo-wrapper'),
    connection = new Mongo.Connection('mongodb://localhost:27017/foursqare'),
    collection = connection.collection('venues'),
    csv = require('to-csv');

program
    .version(packagejson.version)
    .description('export data');
program.parse(process.argv);

collection.find({
    rating: {
        $gte: 6
    }
}).toArray().then(function (venues) {
    console.log(csv(venues.map(function (venue) {
        return {
            rating: venue.rating,
            lat: venue.location.lat,
            lng: venue.location.lng
        };
    })));
    process.exit(0);
});
