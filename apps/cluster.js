/**
 * @file cluster venues
 */

var program = require('commander');
var packagejson = require('./package.json');
var Mongo = require('schema-check-mongo-wrapper');
var connection = new Mongo.Connection('mongodb://localhost:27017/foursqare');
var collection = connection.collection('venues');



program
    .version(packagejson.version)
    .description('clusters venues');
program.parse(process.argv);

collection.find({}).toArray().then(function (venues) {
    console.log(venues.length);
    console.log(venues[0]);
    //TODO: group by streets, then cluster somehow
}).always(function (p) {
    process.exit(0);
    return p;
}).done();
