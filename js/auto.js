// Map
var map = L.map("map", { zoomControl: false }).setView([32.747, -117.181], 12);
// Basemap
L.esri.basemapLayer("Streets", { /*detectRetina: true*/ }).addTo(map);
// L.esri.basemapLayer("Gray", { detectRetina: true }).addTo(map);
// L.esri.basemapLayer("GrayLabels", { /*detectRetina: true*/ }).addTo(map);

// Colors from d3.scale.catgory20:  https://github.com/mbostock/d3/wiki/Ordinal-Scales#category20
var colors = ["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5", "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5"];
var featureIndex = -1;

var neighborhoods = [];
var hoodLayer = L.geoJson(null, {
  onEachFeature: neighborhood,
  style: hoodStyle
});
// San Diego neighborhoods from topojson
hoodLayer = omnivore.topojson("data/sdpd_beats.topojson", null, hoodLayer).addTo(map);
hoodLayer.on("ready", function() {
  hoodLayer.eachLayer(function(l) { 
    var name = l.feature.properties.name;
    if ( neighborhoods.indexOf(name) === -1 ) {
      neighborhoods.push(name);
    }
  });
  neighborhoods.sort();
});

// So easy, thanks http://leafletjs.com/examples/mobile-example.html
function onLocationFound(e) {
  L.marker(e.latlng).addTo(map).bindPopup("Current approximate location.").openPopup();
}
function onLocationError(e) {
  alert(e.message);
}
map.on("locationfound", onLocationFound);
map.on("locationerror", onLocationError);
map.locate();

function neighborhood(feature, layer) {
  // does this feature have a property named popupContent?
  if ( feature.properties && feature.properties.name ) {
    layer.bindPopup(feature.properties.name.toLowerCase());
    layer.on({
      click: highlight
    });
  }
}
var highlighted;
var yellowOutline = { color: "#fbec5d", weight: 3 };
var whiteOutline = { color: "#fff", weight: 1 };
function highlight(e) {
  if ( highlighted ) {
    highlighted.setStyle(whiteOutline);
  }
  e.target.bringToFront();
  e.target.setStyle(yellowOutline);
  highlighted = e.target;
}
function hoodStyle() {
  featureIndex += 1;
  return {
    color: "#fff",
    opacity: 1,
    fillColor: colors[featureIndex % colors.length],
    fillOpacity: 0.25,
    weight: 1
  };
};

// Size and position the suggestion div.
var suggestions = document.getElementById("suggestions");
suggestions.addEventListener("click", function(e) {
  // console.log("suggestions click", e);
  hood.value = e.target.innerHTML;
  searchNeighborhoods(e.target.innerHTML);
  hideSuggestions();
});

var selectedIndex = -1;
var selectedSuggestion;
var matches;

// Listen for key presses in search box.
var hood = document.getElementById("hood");
hood.addEventListener("keyup", function(e) {
  // console.log("key", e);
  var val = this.value;
  if ( val.length < 3 ) {
    hideSuggestions();
    return;
  }
  if ( e.keyCode === 13 ) {
    // Enter was pressed.
    var n = document.querySelector("div.selected")
    if ( n ) {
      n = n.innerHTML;
    } else {
      n = this.value;
    }
    this.value = n;
    selectedIndex = -1;
    hideSuggestions();
    searchNeighborhoods(n);
    return;
  }
  if ( e.keyCode === 38 || e.keyCode === 40 ) {
    // Up (38) or down (40) arrow was pressed.
    // (e.keyCode === 38) ? 
    if ( e.keyCode === 38 ) {
      if ( selectedIndex === 0 ) {
        selectedIndex = matches.length - 1;
      } else {
        selectedIndex -= 1;
      }
    } 
    if ( e.keyCode === 40 ) {
      if ( selectedIndex === matches.length - 1 ) {
        selectedIndex = 0;
      } else {
        selectedIndex += 1;
      }
    }
    if ( selectedIndex > (matches.length - 1) ) {
      selectedIndex = 0;
    }
    if ( selectedSuggestion ) {
      selectedSuggestion.classList.remove("selected");
    }
    selectedSuggestion = document.querySelectorAll("#suggestions div")[selectedIndex];
    selectedSuggestion.classList.add("selected");
    return;
  }
  matches = neighborhoods.filter(function(n) {
    // All neighborhood names are upper case.
    return n.indexOf(val.toUpperCase()) > -1;
  }, this);
  // Put neighborhoods that match first letter at the top of the suggestion list.
  // There's probably a more clever, more efficient way to do this with splice()
  // ...but the code below is easier to understand.
  var front = [], back = [];
  for ( var i = 0, il = matches.length; i < il ; i++ ) {
    if ( matches[i] && matches[i][0] === val[0].toUpperCase() ) {
      front.push(matches[i]);
    } else {
      back.push(matches[i])
    }
  }
  showSuggestions(front.concat(back));
});

function hideSuggestions() {
  suggestions.style.display = "none";
}

function showSuggestions(matches) {
  // Remove all previous suggestions.
  while (suggestions.firstChild) {
      suggestions.removeChild(suggestions.firstChild);
  }
  // Position the suggestions box, build a list and display it.
  var hoodBox = document.getElementById("hood").getBoundingClientRect();
  var suggestLeft = hoodBox.left + "px";
  var suggestTop = hoodBox.top + hoodBox.height + "px";
  var suggestWidth = hoodBox.width + "px";
  suggestions.style.left = suggestLeft;
  suggestions.style.top = suggestTop;
  suggestions.style.width = suggestWidth;
  suggestions.style.display = "block";
  var frag = document.createDocumentFragment();
  matches.forEach(function(m) {
    var s = document.createElement("div");
    s.appendChild(document.createTextNode(m.toLowerCase()));
    frag.appendChild(s);
  });
  suggestions.appendChild(frag);
}

function searchNeighborhoods(match) {
  match = match.toUpperCase();
  var found = false;
  hoodLayer.eachLayer(function(l, index) {
    if ( l.feature.properties.name === match ) {
      found = true;
      l.bringToFront();
      var center = l.getBounds().getCenter();
      map.setView(center);
      map.openPopup(match.toLowerCase(), center);
      highlighted = l;
      l.setStyle(yellowOutline);
    } else {
      l.setStyle(whiteOutline);
    }
  });
  if ( !found ) {
    alert("Couldn't find " + match + ", please try again.");
  }
}
