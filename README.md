# San Diego Neighborhoods

[View it live](http://rawr.gr/sdn)

### Source data
I came across a pdf map of [San Diego neighborhoods](http://www.sangis.org/docs/services/San_Diego_neighborhoods.pdf). It's helpful, but I wanted something more interactive. The closest thing I was able to find was a [map of police stations on ArcGIS Online](http://sandiego.maps.arcgis.com/apps/OnePane/basicviewer/index.html?appid=fd71ebb862f241ef9ba4e7159749cb46) that seems to correspond to the data in the neighborhood pdf. So all the data was there, but it wasn't easily searchable.

After a little more poking around, I found a [shapefile named SDPD_BEATS](http://rdw.sandag.org/Default.aspx?dir=Law). Bingo. 

### Data Conversions

Now that I had the data, I needed to wrap it in an easily searchable website. First up, convert from shape file to... to... well, I tried a couple things. After converting to GeoJSON and getting a ~7MB file (for 100 polygons, ahem), I decided I needed to simplify the neighborhood boundaries if I hoped to have a site that would load in a reasonable time. I decided [TopoJSON](https://github.com/mbostock/topojson) was the best bet. 

There was also the fact that the source shapefile was in [California State Plane](http://epsg.io/102646) and all the tools I was considering work best with data in WGS84. `ogr2ogr` makes that conversion easy. Here's the command I used to re-project the boundaries:

```
SOURCE=SDPD_BEATS.shp
WGS84=sdpd_beats_wgs84.shp
ogr2ogr -s_srs EPSG:102646 -t_srs EPSG:4326 $WGS84 $SOURCE
```

Next up is to convert the shape file in WGS84 to TopoJSON:

```
OUT=topojson
PROPS="name=NAME"
topojson -p $PROPS -o $OUT/sdpd_beats.topojson $WGS84
```

This kicked out a ~300k file, but that still felt big for ~100 features. I also did some feature simplification tests with ogr2ogr but quickly realized it doesn't maintain topology across the entire dataset when simplifying. 

I didn't know what level of simplification would be acceptable, so I generated a few with a loop (I like bash, should be easy in your shell of choice):

```
for i in `seq 1 9`;
do
  topojson -p $PROPS -o $OUT/sdpd_beats_0.$i.topojson --simplify-proportion 0.$i $WGS84
done 
```

The smallest (and most generalized) version ended up being acceptable and weighed in at a sleek 50k. Now to put it on a map.

### Make a map

Leaflet, along with [leaflet-omnivore](https://github.com/mapbox/leaflet-omnivore) makes putting the data on a map trivial. The fun part came when building the search UI.

I went with a barebones but custom auto-complete box. All the magic happens in [auto.js](../../tree/master/js/auto.js). There are lots of globals, and it kinda has a pasta vibe but it works. I'm trying not to stress or get too crazy with refactoring it since it works. Done is better than...blah blah blah.

I also put a little work into making the map work well on phones. This consisted of making the search box span the entire with of the screen on small displays. Check out the media queries in [styles.css](../../tree/master/css/styles.css) for specifics.

### Next

~~It'd be nice to add geolocation along with some point-in-polygon to tell people which neighborhood they're in. I might get to it. I might not.~~

I got to it after noticing that [Leaflet provides a simple way to do this](http://leafletjs.com/reference.html#map-locate). Guess all that's left is to refactor and clean up.