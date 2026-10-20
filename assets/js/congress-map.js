// Map of conference and workshop venues. Data comes from _data/conferences.yml via _includes/conferences.html.
(function () {
  var root = document.getElementById("congress-map");
  var entries = JSON.parse(document.getElementById("congress-data").textContent);
  if (!root || !entries.length || !window.L) return;

  // several congresses can share a city (e.g. Dresden), so group them into one marker per place
  var places = {};
  entries.forEach(function (c) {
    var key = c.lat + "," + c.lon;
    (places[key] = places[key] || { lat: c.lat, lon: c.lon, venue: c.venue, items: [] }).items.push(c);
  });
  var list = Object.keys(places).map(function (k) { return places[k]; });

  // research stays (_data/stays.yml) are drawn in red, conferences and schools in orange
  var stays = JSON.parse(document.getElementById("stays-data").textContent);

  var map = L.map(root, { scrollWheelZoom: false, minZoom: 1 });
  // OpenStreetMap tiles need no API key
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 12,
    attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors"
  }).addTo(map);

  // nearby markers merge into a numbered cluster that opens on click, so close-together points stay clickable
  var markers = L.markerClusterGroup({ maxClusterRadius: 40, spiderfyOnMaxZoom: true, showCoverageOnHover: false });
  map.addLayer(markers);

  list.forEach(function (p) {
    var rows = p.items.map(function (c) {
      return "<li><code>" + c.date.split("-").reverse().join("/") + "</code> " + c.name + " (" + c.type + ")</li>";
    }).join("");
    L.circleMarker([p.lat, p.lon], {
      radius: 5 + 2 * Math.sqrt(p.items.length),
      color: "#252a34", weight: 2,
      fillColor: "#e8a33d", fillOpacity: 0.9
    }).bindPopup("<strong>" + (p.venue || "") + "</strong><ul class=\"congress-map__list\">" + rows + "</ul>").addTo(markers);
  });

  stays.forEach(function (s) {
    var when = s.date ? s.date.split("-").reverse().join("/") + (s.end ? " – " + s.end.split("-").reverse().join("/") : "") : "";
    var hosts = (s.groups || []).map(function (g) { return "<br>" + g; }).join("");
    L.circleMarker([s.lat, s.lon], {
      radius: 7, color: "#252a34", weight: 2,
      fillColor: "#e5534b", fillOpacity: 0.9
    }).bindPopup("<strong>Research stay</strong><br>" + s.name + "<br>" + s.venue + hosts + (when ? "<br><code>" + when + "</code>" : "")).addTo(markers);
  });

  var points = list.map(function (p) { return [p.lat, p.lon]; }).concat(stays.map(function (s) { return [s.lat, s.lon]; }));
  map.fitBounds(L.latLngBounds(points), { padding: [24, 24], maxZoom: 6 });
})();
