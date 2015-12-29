/**
 * @file cluster by network
 */

var program = require('commander');
var Mongo = require('schema-check-mongo-wrapper');
var connection = new Mongo.Connection('mongodb://localhost:27017/foursqare');
var collection = connection.collection('venues');

/**
 * callback for program.option
 */
function list(s) {
    return s.split(',').map(Number);
}

program
    .option('--bbox <items>', 'Venues bbox, lat, lng', list)
    .option('--ways [string]', 'json with ways exported from OSM', String)
    .description('clusters venues');

program.parse(process.argv);

var nodes = require(process.cwd() + '/' + program.ways).elements;

console.log('nodes', nodes.length);

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
    console.log('venues', venues.length);
}).done(function () {
    process.exit(0);
});
