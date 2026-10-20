---
layout: single
author_profile: true
classes: wide
title: "Research map"
permalink: /_pages/map/
---

Each large dot is a research keyword and each small grey dot is one of my papers; a paper is linked to its keywords. Orange keywords are materials and phenomena, blue ones are experiments and techniques.
Hover a keyword to see its papers, hover a paper for its details. Click a keyword to filter the [list of papers](/_pages/papers/), or a paper to open it.

<div id="research-map" class="research-map" data-papers-url="{{ '/_pages/papers/' | relative_url }}" role="img" aria-label="Network of papers and keywords. The same information is available as a list on the Papers page."></div>

<script id="papers-data" type="application/json">{{ site.data.papers | jsonify }}</script>
<script src="https://cdn.jsdelivr.net/npm/d3@7"></script>
<script src="{{ '/assets/js/research-map.js' | relative_url }}"></script>
