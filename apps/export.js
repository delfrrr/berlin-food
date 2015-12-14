/**
 * export data
 */

var program = require('commander'),
    packagejson = require('./../package.json'),
    Mongo = require('schema-check-mongo-wrapper'),
    connection = new Mongo.Connection('mongodb://localhost:27017/foursqare'),
    collection = connection.collection('venues'),
    csv = require('to-csv');

program
    .version(packagejson.version)
    .option('-f, --format [format]', 'Output format', /^(csv)|(geojson)$/, 'csv')
    .option('-r, --rating [number]', 'Minimal rating', 9)
    .description('export data');
program.parse(process.argv);

function outputCsv(venues) {
    console.log(csv(venues.map(function (venue) {
        return {
            rating: venue.rating,
            lat: venue.location.lat,
            lng: venue.location.lng
        };
    })));
}

function outputGeojson(venues) {
    console.log(JSON.stringify(venues.map(function (venue) {
        return {
            'type': 'Feature',
            'geometry': {
                'type': 'Point',
                'coordinates': [
                    venue.location.lng,
                    venue.location.lat
                ]
            },
            'properties': {
                'title': venue.name,
                'marker-color': '#' + venue.ratingColor,
            }
         };
    })));
}
collection.find({
    rating: {
        $gte: Number(program.rating)
    }
}).toArray().then(function (venues) {
    if (program.format === 'csv') {
        outputCsv(venues);
    } else {
        outputGeojson(venues);
    }
}).fail(function (e) {
    console.error(e);
}).always(function (p) {
    p.done();
    process.exit(0);
});
