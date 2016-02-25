# Berlin Food

## What

![alt tag](https://cdn-images-1.medium.com/max/800/1*vGRBkANlAwY4oWyRIvj-tw.png)

It's a source code of Foursquare complimentary tool, which enables exploring city neighbourhoods with a high density of restaurants. It utilizes clustering based on a street network. You can [test it here](http://delfrrr.github.io/berlin-food/).

## Developer notes

#### Start mongo

    $ mongod --dbpath=./data

### Export to geojson

    $ node apps/export.js -f geojson -r 0 geojson/all-venues.json

### Build

    $ npm run build

### start web server with map page

    $ npm start

### Venue data example

```js

{ _id: 55d84cbd5a5da9f22415d0a2,
  id: '4d30b1aca241f04d61efb627',
  name: 'Samadhi Vegetarisches Restaurant',
  contact: { phone: '+493022488850', formattedPhone: '+49 30 22488850' },
  location:
   { address: 'Wilhelmstraße 77',
     crossStreet: 'Behrenstraße',
     lat: 52.51465422529233,
     lng: 13.381672311467842,
     distance: 50,
     postalCode: '10117',
     cc: 'DE',
     city: 'Berlin',
     state: 'Berlin',
     country: 'Deutschland',
     formattedAddress:
      [ 'Wilhelmstraße 77 (Behrenstraße)',
        '10117 Berlin',
        'Deutschland' ] },
  categories:
   [ { id: '4bf58dd8d48988d1d3941735',
       name: 'Vegetarian / Vegan Restaurant',
       pluralName: 'Vegetarian / Vegan Restaurants',
       shortName: 'Vegetarian / Vegan',
       icon: [Object],
       primary: true } ],
  verified: false,
  stats: { checkinsCount: 347, usersCount: 287, tipCount: 16 },
  url: 'http://www.samadhi-vegetarian.de',
  price: { tier: 2, message: 'Moderate', currency: '€' },
  rating: 7.3,
  ratingColor: 'C5DE35',
  ratingSignals: 41,
  allowMenuUrlEdit: true,
  hours: { status: 'Open until 11:00 PM', isOpen: true },
  specials: { count: 0, items: [] },
  photos: { count: 23, groups: [] },
  hereNow: { count: 0, summary: 'Nobody here', groups: [] } }
```

### Export Berlin streets

Overpass api query

Mitte:

```
[out:json];
way
  [highway]
  (52.5237,13.3886,52.5427,13.4354);
(._;>;);
out;
```

Berlin:

```
[out:json];
way
  [highway]
  (52.38029861450195,13.247178093419942,52.65529274940338,13.519765);
(._;>;);
out;
```

See
 * http://overpass-turbo.eu/
 * http://wiki.openstreetmap.org/wiki/Key:highway

### Run Mitte NDE clustering

    $ node ./apps/nde-cluster.js --bbox 52.5237,13.3886,52.5427,13.4354 --ways ./geojson/mitte.json

### Run Berlin NDE clustering

    $ node ./apps/nde-cluster.js --bbox 52.38029861450195,13.247178093419942,52.65529274940338,13.519765 --ways ./geojson/berlin.json > geojson/streets.json

### Run clusters post processing

    $ node apps/process-clusters.js --clusters ./geojson/berlin-clusters.json --out ./geojson/
