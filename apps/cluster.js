/**
 * @file cluster venues
 */

/**
 * @typedef {Object} Venue
 * @see README.md
 */

var program = require('commander');
var packagejson = require('./../package.json');
var Mongo = require('schema-check-mongo-wrapper');
var connection = new Mongo.Connection('mongodb://localhost:27017/foursqare');
var collection = connection.collection('venues');
var soundex = require('soundex-code');
// var metaphone = require('metaphone');

/**
 * @const {string} street name was not detected
 */
var UNKNOWN_STREET_NAME = 'UNKNOWN_STREET_NAME';

/**
 * @param {Venue} venue
 * @return {string|UNKNOWN_STREET_NAME} street name
 */
function getStreetName(venue) {
    var address = venue.location.address;
    var streetName;
    if (!venue.location.address) {
        streetName = UNKNOWN_STREET_NAME;
    } else {
        streetName = address.replace(/[\s\.]+\d.*$/, '');
    }
    return streetName;
}

/**
 * @param {string|UNKNOWN_STREET_NAME} streetName
 */
function calcSoundex(streetName) {
    if (streetName === UNKNOWN_STREET_NAME) {
        return streetName;
    } else {
        //better to have less precigion here
        //it's low probability that similiar name streets are close to each other
        return soundex(streetName, 4);
        // return metaphone(streetName);
    }
}

/**
 * Reduce callback
 * @param {ByStreetName} byStreet
 * @param {Venue} venue
 * @return {ByStreetName}
 */
function groupByStreetName(byStreet, venue) {
    var sreeetName = getStreetName(venue);
    var sc = calcSoundex(sreeetName);
    if (!byStreet[sc]) {
        byStreet[sc] = [];
    }
    byStreet[sc].push(venue);
    return byStreet;
}

program
    .version(packagejson.version)
    .description('clusters venues');
program.parse(process.argv);

collection.find({}).toArray().then(function (venues) {
    var result = venues.reduce(groupByStreetName, {});
    console.log(
        Object.keys(result)
        .sort()
        // .sort(function (n1, n2) {
        //     var l1 = result[n1].length;
        //     var l2 = result[n2].length;
        //     return l1 - l2;
        // })
        .map(function (streetName) {
            var testVenue = result[streetName][0];
            return [
                streetName,
                getStreetName(testVenue),
                result[streetName].length
            ];
        })
    );
    console.log(Object.keys(result).length, venues.length/Object.keys(result).length);
    // console.log(result['K61623535'].map(function (venue) {
    //     return venue.location.address;
    // }));
}).always(function (p) {
    setTimeout(function () {
        process.exit(0);
    });
    return p;
}).done();
