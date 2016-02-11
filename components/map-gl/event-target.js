/**
 * gets mouse event best matching circles
 * @module event-target
 */

'use strict';

/**
 * @param {mapboxgl.Point} p1
 * @param {mapboxgl.Point} p2
 * @return {Number} pixel distance
 */
function pointDistance(p1, p2) {
    var dx = p1.x - p2.x;
    var dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * @param {mapboxgl.EventData} e
 * @param {Point[]} features
 * @param {mapboxgl.Map} map
 * @param {RegExp} regExp - filter class id
 */
module.exports = function (e, features, map, regExp) {
    var targetObjects;
    if (
        features &&
        features.length &&
        (targetObjects = features.filter(function (f) {
            return (
                f.layer.id.match(regExp) &&
                f.properties.lngLat &&
                (
                    pointDistance(
                        map.project(f.properties.lngLat),
                        e.point
                    ) <= f.layer.paint['circle-radius']
                )
            );
        })).length
    ) {
        return targetObjects[0];
    }
};
