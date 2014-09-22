// Map
var map = L.map("map", { zoomControl: false }).setView([32.747, -117.181], 12);
// Basemap
L.esri.basemapLayer("Streets", { detectRetina: true }).addTo(map);
// San Diego neighborhoods from topojson
var hoodStyle = {
  "color": "#111",
  "weight": 2,
  "opacity": 0.5
};
var neighborhoods = [];
var hoodLayer = L.geoJson(null, {
  onEachFeature: neighborhood,
  style: hoodStyle
});
hoodLayer = omnivore.topojson("data/sdpd_beats.topojson", null, hoodLayer).addTo(map);
hoodLayer.on("ready", function() {
  hoodLayer.eachLayer(function(l) { 
    neighborhoods.push(normalize(l.feature.properties.name));
  });
});
// Geocoder
var currentSearch; // Keep track of search term.
var results = new L.LayerGroup().addTo(map);
var searchControl = new L.esri.Controls.Geosearch({ 
  "forStorage": false,
  // "useMapBounds": 6,
  "zoomToResult": false
}).addTo(map);
searchControl.on("loading", searchNeighborhoods);
searchControl.on("results", displayResults)

function displayResults(data) {
  console.log("geocode results", data);
  // map.closePopup();
  results.clearLayers();
  if (!data.results.length) {
    return;
  }
  for (var i = data.results.length - 1; i >= 0; i--) {
    if ( data.results[i].match === "StreetAddress" || data.results[i].match === "StreetName" ) {
      var marker = L.marker(data.results[i].latlng);
      results.addLayer(marker);
      // Find containing neighborhood, if it exists.
      var match = leafletPip.pointInLayer(data.results[i].latlng, hoodLayer);
      if ( match ) {
        var hood = formatResult(match, data.results[i]);
        var place = "<br>(" + data.results[i].address + ")"
        marker.bindPopup(hood);
      }
    }
  };
}
function neighborhood(feature, layer) {
  var labelOptions = { noHide: true };
  // does this feature have a property named popupContent?
  if ( feature.properties && feature.properties.name ) {
    var name = feature.properties.name;
    name = name.replace(/\w\S*/g, titleCase);
    layer.bindPopup(name)
  }
}
// Source:  http://stackoverflow.com/a/196991/1934
function titleCase(txt){
  return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
}
function searchNeighborhoods(e) {
  var match = false;
  currentSearch = searchControl._input.value;
  console.log("updated currentSearch:", currentSearch);
  if ( e.type === "loading" ) { 
    // From the geocoder, look for a matching neighborhood name.
    var terms = currentSearch.split(",");
    for ( var i = 0; i < terms.length; i++ ) {
      var term = normalize(terms[i]);
      console.log("term in searchNeighborhoods:", term);
      for ( var j = 0; j < neighborhoods.length; j++ ) {
        if ( term.indexOf(neighborhoods[j]) > -1 ) {
          match = neighborhoods[j];
          console.log("found a match:", match);
          break;
        } 
      }
    }
  }
  if ( match && match.length ) {
    console.log("match!", match);
    hoodLayer.eachLayer(function(l, index) {
      if ( l.feature.properties.name === match ) {
        l.openPopup();
      }
    });
  }
}
function formatResult(match, data) {
  var term = currentSearch;
  var content = match[0].feature.properties.name.replace(/\w\S*/g, titleCase); 
  content += "<br>(" + data.address + ")";
  return content;
}
function normalize(s) {
  return s.replace(/'/g, "").toUpperCase();
}
