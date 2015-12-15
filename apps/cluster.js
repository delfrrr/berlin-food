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
var turf = require('turf');
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

/**
 * @const
 */
var MAX_WALK_DISTANCE = 50; //meters

/**
 * @param {Venue} venue
 * @return {Point}
 */
function getPoint(venue) {
    var location = venue.location;
    return {
        'type': 'Feature',
        'properties': {},
        'geometry': {
            'type': 'Point',
            'coordinates': [location.lng, location.lat]
        }
    };
}

/**
 * Callback for reduce
 * @param {Venue[][]} groups
 * @param {Venue} venue
 */
function groupByDistance(groups, venue) {
    var newGroup = [venue];
    //leave only groups which are not close to venue
    groups = groups.filter(function (group) {
        //check if any group venue close to venue
        if (group.some(function (groupVenue) {
            var distance = turf.distance(
                getPoint(venue),
                getPoint(groupVenue),
                'kilometers'
            ) * 1000;
            return distance < MAX_WALK_DISTANCE;
        })) {
            //if close attach group to new group
            newGroup = newGroup.concat(group);
            return false;
        } else {
            return true;
        }
    });
    groups.push(newGroup);
    return groups;
}

program
    .version(packagejson.version)
    .description('clusters venues');
program.parse(process.argv);

collection.find({}).toArray().then(function (venues) {
    var groupsByStreet = venues.reduce(groupByStreetName, {});
    var groupsByStreetAndDistance = Object.keys(groupsByStreet).map(function (sc) {
        return groupsByStreet[sc];
    }).map(function (streetGroup) {
        return streetGroup.reduce(groupByDistance, []);
    }).reduce(function (groupsByStreetAndDistance, streetGroups) {
        return groupsByStreetAndDistance.concat(streetGroups);
    }, []);
    console.log(groupsByStreetAndDistance.sort(function (g1, g2) {
        return g1.length - g2.length;
    }).map(function (g) {
        var testVenue = g[0];
        return [getStreetName(testVenue), g.length];
    }));
    console.log('groupsByStreetAndDistance', groupsByStreetAndDistance.length);
}).always(function (p) {
    setTimeout(function () {
        process.exit(0);
    });
    return p;
}).done();
