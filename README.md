# Foursquare map

## Start mongo

    $ mongod --dbpath=./data

## Export to geojson

    $ node apps/export.js -f geojson -r 0 geojson/all-venues.json

## start web server with map page

    $ node apps/map.js
