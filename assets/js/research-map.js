// Force-directed keyword <-> paper map. Data comes from _plugins/papers_data.rb (papers.bib).
(function () {
  var root = document.getElementById("research-map");
  var papers = JSON.parse(document.getElementById("papers-data").textContent);
  if (!root || !papers.length || !window.d3) return;

  var css = {
    keyword: "#e8a33d",   // categorical slot 2 (dark surface): material and phenomenon keywords
    method: "#3987e5",    // categorical slot 1 (dark surface): experiment and technique keywords
    paper: "#c3c2b7",     // secondary ink: papers are the items being described
    text: "#f0efec",
    muted: "#c3c2b7",
    surface: "#252a34"    // site background, used for the ring/halo around marks
  };

  // experiment and technique keywords get their own colour; everything else is a material/phenomenon keyword
  var methodKw = { "experiments": 1, "DFT": 1, "disorder": 1, "external fields": 1, "Floquet and driving": 1, "transport": 1 };
  var kwColor = function (d) { return methodKw[d.label] ? css.method : css.keyword; };

  var kwCount = {};
  papers.forEach(function (p) { p.keywords.forEach(function (k) { kwCount[k] = (kwCount[k] || 0) + 1; }); });
  var nodes = Object.keys(kwCount).map(function (k) { return { id: "k:" + k, type: "kw", label: k, n: kwCount[k] }; })
    .concat(papers.map(function (p) { return { id: "p:" + p.key, type: "paper", paper: p }; }));
  var links = [];
  papers.forEach(function (p) { p.keywords.forEach(function (k) { links.push({ source: "p:" + p.key, target: "k:" + k }); }); });

  var W = root.clientWidth || 900, H = Math.max(460, Math.min(600, W * 0.62));
  var rKw = function (d) { return 8 + 2.4 * Math.sqrt(d.n); };
  var rPaper = 6;

  var svg = d3.select(root).append("svg").attr("viewBox", [0, 0, W, H]).attr("width", "100%").style("display", "block");
  var linkSel = svg.append("g").attr("stroke", css.muted).attr("stroke-opacity", 0.28).attr("stroke-width", 1)
    .selectAll("line").data(links).join("line");
  var nodeSel = svg.append("g").selectAll("g").data(nodes).join("g").attr("tabindex", 0).style("cursor", "pointer");
  nodeSel.append("circle")
    .attr("r", function (d) { return d.type === "kw" ? rKw(d) : rPaper; })
    .attr("fill", function (d) { return d.type === "kw" ? kwColor(d) : css.paper; })
    .attr("stroke", css.surface).attr("stroke-width", 2);
  nodeSel.filter(function (d) { return d.type === "kw"; }).append("text")
    .text(function (d) { return d.label; })
    .attr("dy", function (d) { return -rKw(d) - 5; }).attr("text-anchor", "middle")
    .attr("fill", css.text).attr("font-size", 14)
    .attr("stroke", css.surface).attr("stroke-width", 3).attr("paint-order", "stroke")
    .style("pointer-events", "none");

  var sim = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(function (d) { return d.id; }).distance(70).strength(0.5))
    .force("charge", d3.forceManyBody().strength(function (d) { return d.type === "kw" ? -600 : -60; }))
    .force("collide", d3.forceCollide(function (d) { return (d.type === "kw" ? rKw(d) + 20 : rPaper + 4); }))
    .force("x", d3.forceX(W / 2).strength(0.08))
    .force("y", d3.forceY(H / 2).strength(0.08))
    .stop();

  // keep every node inside a circle centred on the map, so the layout reads as one rounded cluster
  // instead of spreading into the corners of the rectangle
  var cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 20;
  function render() {
    nodes.forEach(function (d) {
      var r = d.type === "kw" ? rKw(d) + 26 : rPaper + 4;
      var dx = d.x - cx, dy = d.y - cy, dist = Math.hypot(dx, dy), max = R - r;
      if (dist > max && dist > 0) { d.x = cx + dx * max / dist; d.y = cy + dy * max / dist; }
    });
    linkSel.attr("x1", function (d) { return d.source.x; }).attr("y1", function (d) { return d.source.y; })
      .attr("x2", function (d) { return d.target.x; }).attr("y2", function (d) { return d.target.y; });
    nodeSel.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });
  }
  // settle the layout up front so the map does not jiggle on load; the live simulation is only used for dragging
  for (var i = 0; i < 500; i++) sim.tick();
  render();
  sim.on("tick", render);

  nodeSel.call(d3.drag()
    .on("start", function (e, d) { if (!e.active) sim.alphaTarget(0.25).restart(); d.fx = d.x; d.fy = d.y; })
    .on("drag", function (e, d) { d.fx = e.x; d.fy = e.y; })
    .on("end", function (e, d) { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));

  // tooltip
  var tip = d3.select(root).style("position", "relative").append("div").attr("class", "research-map__tip").style("display", "none");
  function showTip(d, event) {
    var html;
    if (d.type === "kw") {
      html = "<strong>" + d.label + "</strong><br>" + d.n + " paper" + (d.n > 1 ? "s" : "");
    } else {
      var p = d.paper;
      var au = p.authors.length > 4 ? p.authors.slice(0, 3).join(", ") + " et al." : p.authors.join(", ");
      html = "<strong></strong><br><span class=\"research-map__tip-meta\"></span>";
      tip.html(html);
      tip.select("strong").text(p.title);
      tip.select("span").text(au + " · " + (p.journal || "preprint") + " · " + p.year);
    }
    if (d.type === "kw") tip.html(html);
    var box = root.getBoundingClientRect();
    var x = event ? event.clientX - box.left : d.x, y = event ? event.clientY - box.top : d.y;
    tip.style("display", "block")
      .style("left", Math.min(Math.max(10, x + 14), W - 270) + "px")
      .style("top", (y + 16) + "px");
  }

  // highlight neighbours
  var neighbours = {};
  links.forEach(function (l) {
    var s = l.source.id || l.source, t = l.target.id || l.target;
    (neighbours[s] = neighbours[s] || {})[t] = 1;
    (neighbours[t] = neighbours[t] || {})[s] = 1;
  });
  function focusOn(d) {
    var nb = neighbours[d.id] || {};
    nodeSel.style("opacity", function (n) { return n.id === d.id || nb[n.id] ? 1 : 0.15; });
    linkSel.style("opacity", function (l) { return l.source.id === d.id || l.target.id === d.id ? 1 : 0.05; })
      .attr("stroke-opacity", function (l) { return l.source.id === d.id || l.target.id === d.id ? 0.7 : 0.28; });
    nodeSel.filter(function (n) { return n.type === "kw" && (n.id === d.id || nb[n.id]); }).select("text").attr("font-weight", "bold");
  }
  function clearFocus() {
    nodeSel.style("opacity", 1); linkSel.style("opacity", 1).attr("stroke-opacity", 0.28);
    nodeSel.select("text").attr("font-weight", null);
    tip.style("display", "none");
  }
  nodeSel.on("mouseenter", function (e, d) { focusOn(d); showTip(d, e); })
    .on("mousemove", function (e, d) { showTip(d, e); })
    .on("mouseleave", clearFocus)
    .on("focus", function (e, d) { focusOn(d); showTip(d); })
    .on("blur", clearFocus)
    .on("click", function (e, d) {
      if (e.defaultPrevented) return; // was a drag
      if (d.type === "kw") location.href = root.dataset.papersUrl + "#kw=" + encodeURIComponent(d.label);
      else if (d.paper.url) window.open(d.paper.url, "_blank", "noopener");
    });

  // legend (identity never relies on colour alone: size + labels differ too)
  var legend = d3.select(root).append("div").attr("class", "research-map__legend");
  legend.html("<span><i style=\"background:" + css.keyword + ";width:14px;height:14px\"></i> material keyword (size = number of papers)</span>" +
              "<span><i style=\"background:" + css.method + ";width:14px;height:14px\"></i> experiment or technique keyword</span>" +
              "<span><i style=\"background:" + css.paper + "\"></i> paper</span>" +
              "<a href=\"" + root.dataset.papersUrl + "\">Table view: list of papers</a>");
})();
