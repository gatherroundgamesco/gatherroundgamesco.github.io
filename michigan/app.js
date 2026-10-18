/* Michigan Live Map v2 — Leaflet 1.9.4 + this file. No build step, no keys, no accounts. */
(function () {
  'use strict';

  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var sideMQ = window.matchMedia ? window.matchMedia('(min-width: 900px) and (orientation: landscape), (min-width: 1100px)') : null;
  var TZ = 'America/Detroit';
  var TIMEOUT_MS = 10000;
  var AUTO_REFRESH_MS = 10 * 60 * 1000;

  /* ---------------------------------------------------------------
   * Places (copied from v1: 15 POIs, blurbs, fact chips, one link each)
   * ------------------------------------------------------------- */
  var POIS = [
    { id: 'detroit', name: 'Detroit', kind: 'city', lat: 42.3314, lng: -83.0458, label: 'right',
      region: 'Southeast', bestFor: 'Urban weekend',
      line: 'Riverfront downtown with the Detroit RiverWalk, Motown history, and a deep food scene.',
      url: 'https://visitdetroit.com/' },
    { id: 'ann-arbor', name: 'Ann Arbor', kind: 'city', lat: 42.2808, lng: -83.7430, label: 'left',
      region: 'Southeast', bestFor: 'Campus & culture',
      line: 'College town on the Huron River, home of the University of Michigan and Nichols Arboretum.',
      url: 'https://www.annarbor.org/' },
    { id: 'lansing', name: 'Lansing', kind: 'city', lat: 42.7325, lng: -84.5555, label: 'right',
      region: 'Mid-Michigan', bestFor: 'River trail',
      line: 'State capital on the Grand and Red Cedar rivers, with a 20-mile river trail.',
      url: 'https://www.lansing.org/' },
    { id: 'grand-rapids', name: 'Grand Rapids', kind: 'city', lat: 42.9634, lng: -85.6681, label: 'right',
      region: 'West Michigan', bestFor: 'Beer & arts',
      line: 'West Michigan hub known for its breweries, ArtPrize, and the Grand River downtown.',
      url: 'https://www.experiencegr.com/' },
    { id: 'holland', name: 'Holland', kind: 'city', lat: 42.7875, lng: -86.1089, label: 'left',
      region: 'West Michigan', bestFor: 'Lakefront & tulips',
      line: 'Dutch-heritage lakeshore city with Windmill Island Gardens and a sandy Lake Michigan beach.',
      url: 'https://www.holland.org/' },
    { id: 'frankenmuth', name: 'Frankenmuth', kind: 'city', lat: 43.3317, lng: -83.7380, label: 'right',
      region: 'Thumb', bestFor: 'Bavarian weekend',
      line: 'Little Bavaria on the Cass River \u2014 covered bridge, Christmas shops, and chicken dinners.',
      url: 'https://www.frankenmuth.org/' },
    { id: 'traverse-city', name: 'Traverse City', kind: 'city', lat: 44.7631, lng: -85.6206, label: 'right',
      region: 'Northwest', bestFor: 'Wine & cherries',
      line: 'Cherry capital on Grand Traverse Bay, surrounded by orchards and wineries.',
      url: 'https://www.traversecity.com/' },
    { id: 'sleeping-bear', name: 'Sleeping Bear Dunes', kind: 'outdoors', lat: 44.8822, lng: -86.0417, label: 'left',
      region: 'Northwest', bestFor: 'Dune hikes',
      line: 'Towering sand bluffs above Lake Michigan; the Dune Climb is a classic.',
      url: 'https://www.nps.gov/slbe/' },
    { id: 'mackinac', name: 'Mackinac Island', kind: 'outdoors', lat: 45.8492, lng: -84.6189, label: 'right',
      region: 'Straits', bestFor: 'Car-free island',
      line: 'Car-free island in the Straits of Mackinac, explored by bike, foot, or horse.',
      url: 'https://www.mackinacisland.org/' },
    { id: 'soo-locks', name: 'Soo Locks', kind: 'outdoors', lat: 46.5034, lng: -84.3503, label: 'right',
      region: 'Upper Peninsula', bestFor: 'Freighter watching',
      line: 'Historic locks at Sault Ste. Marie move Great Lakes freighters between Superior and Huron.',
      url: 'https://www.saultstemarie.com/' },
    { id: 'tahquamenon', name: 'Tahquamenon Falls', kind: 'outdoors', lat: 46.5750, lng: -85.2575, label: 'top',
      region: 'Upper Peninsula', bestFor: 'Waterfalls',
      line: 'Root-beer-colored Upper Falls, one of the largest waterfalls east of the Mississippi.',
      url: 'https://www.michigan.gov/recsearch/parks/tahquamenonfalls' },
    { id: 'pictured-rocks', name: 'Pictured Rocks', kind: 'outdoors', lat: 46.4925, lng: -86.5450, label: 'bottom',
      region: 'Upper Peninsula', bestFor: 'Cliff kayaking',
      line: 'Mineral-streaked sandstone cliffs on Lake Superior; Miners Castle is the landmark overlook.',
      url: 'https://www.nps.gov/piro/' },
    { id: 'marquette', name: 'Marquette', kind: 'city', lat: 46.5436, lng: -87.3954, label: 'left',
      region: 'Upper Peninsula', bestFor: 'Lake Superior',
      line: 'Largest Upper Peninsula city, with Presque Isle Park and miles of Lake Superior shore.',
      url: 'https://travelmarquettemichigan.com/' },
    { id: 'porcupine', name: 'Porcupine Mountains', kind: 'outdoors', lat: 46.7556, lng: -89.7868, label: 'right',
      region: 'Upper Peninsula', bestFor: 'Wilderness',
      line: 'Vast UP wilderness with Lake of the Clouds overlooks, old-growth forest, and Superior shoreline.',
      url: 'https://www.michigan.gov/recsearch/parks/porcupinemountains' },
    { id: 'isle-royale', name: 'Isle Royale', kind: 'outdoors', lat: 48.0000, lng: -88.9000, label: 'right',
      region: 'Lake Superior', bestFor: 'Backcountry',
      line: 'Remote wilderness island national park in Lake Superior, reached only by boat or seaplane.',
      url: 'https://www.nps.gov/isro/' }
  ];
  function poiById(id) { for (var i = 0; i < POIS.length; i++) { if (POIS[i].id === id) { return POIS[i]; } } return null; }

  /* badge: [dx, dy] of the badge's 44x44 tap box top-left from the spot (default [-22, -66], above the spot). Set where the
     default would cover a nearby place dot or label at the phone/iPad starting zooms and a few steps in. */
  var WEATHER_SPOTS = [
    { name: 'Detroit', lat: 42.3314, lng: -83.0458 },
    { name: 'Grand Rapids', lat: 42.9634, lng: -85.6681 },
    { name: 'Lansing', lat: 42.7325, lng: -84.5555, badge: [-70, 22] },          // below-left: clear of Grand Rapids / Ann Arbor labels
    { name: 'Traverse City', lat: 44.7631, lng: -85.6206 },
    { name: 'Mackinac', lat: 45.8492, lng: -84.6189, badge: [-22, 22] },         // below: clear of the Soo Locks dot
    { name: 'Marquette', lat: 46.5436, lng: -87.3954 },
    { name: 'Sault Ste. Marie', lat: 46.4953, lng: -84.3453, badge: [-8, -66] }, // above, nudged east: clear of Tahquamenon label
    { name: 'Houghton', lat: 47.1211, lng: -88.5694, badge: [-22, -22] }         // centered (no place dot): clear of Isle Royale
  ];

  /* GLOS Seagull buoys near Michigan: [obs_dataset_id, name, lake, lat, lng, waveParamId, waterTempParamId, windParamId].
     Built from GLOS obs-dataset-summaries + parameters (static metadata); live values come from /api/v2/obs-latest. */
  var BUOYS = [
    [2, "Atwater 20-meter buoy (ATW20)", "Lake Michigan", 43.098, -87.85, 145, 148, 159],
    [3, "Port Sheldon buoy", "Lake Michigan", 42.9, -86.272, 182, 186, 177],
    [33, "Cook Nuclear Plant buoy", "Lake Michigan", 41.983, -86.617, 169, 173, 164],
    [37, "South Haven buoy", "Lake Michigan", 42.397, -86.331, 195, 200, 190],
    [38, "Mackinac Straits West buoy", "Lake Michigan", 45.825, -84.772, 211, 207, 204],
    [43, "Green Bay buoy (GB17)", "Lake Michigan", 44.8, -87.76, 257, 251, 250],
    [44, "North Entry Buoy, North Keweenaw Peninsula", "Lake Superior", 47.27, -88.607, 276, 270, 269],
    [46, "South Entry Buoy, South Keweenaw Peninsula", "Lake Superior", 46.969, -88.398, 305, 299, 298],
    [47, "Michigan City Buoy", "Lake Michigan", 41.755, -86.968, 321, 316, 315],
    [57, "Wilmette Buoy", "Lake Michigan", 42.135, -87.655, 333, 1561, 324],
    [58, "Sleeping Bear Dunes buoy", "Lake Michigan", 44.982, -85.831, 437, 2720, 422],
    [61, "Little Traverse Bay buoy", "Lake Michigan", 45.404, -85.088, 473, 468, 467],
    [62, "Ludington buoy", "Lake Michigan", 43.98, -86.56, 485, 480, 479],
    [67, "Alpena Thunder Bay Buoy", "Lake Huron", 44.988, -83.269, 535, 529, 528],
    [68, "Saginaw Bay Buoy", "Lake Huron", 43.983, -83.6, 550, 545, 536],
    [71, "Toledo Water Intake", "Lake Erie", 41.702, -83.261, 584, 569, 567],
    [87, "Waukegan", "Lake Michigan", 42.367, -87.795, 751, 742, 741],
    [88, "Winthrop", "Lake Michigan", 42.491, -87.779, 762, 753, 752],
    [98, "Chicago Pier Buoy", "Lake Michigan", 41.892, -87.563, 1645, 2949, 1649],
    [118, "North Lake Michigan buoy", "Lake Michigan", 45.344, -86.411, 3108, 0, 3103],
    [139, "Marquette", "Lake Superior", 46.598, -87.372, 2279, 2278, 2282],
    [140, "Grand Marais", "Lake Superior", 46.696, -86.004, 2287, 2286, 2290],
    [153, "Salmon Unlimited, WI Buoy", "Lake Michigan", 42.702, -87.647, 2471, 2457, 2474],
    [154, "Green Bay Entrance Light", "Lake Michigan", 44.654, -87.93, 10192, 2582, 2555],
    [172, "Munising", "Lake Superior", 46.57, -86.568, 3018, 3017, 3021],
    [176, "Copper Harbor Spotter", "Lake Superior", 47.477, -87.87, 3082, 3087, 3081],
    [177, "Mid Lake Superior buoy", "Lake Superior", 48.061, -87.793, 3097, 0, 3092],
    [180, "East Lake Superior buoy", "Lake Superior", 47.585, -86.585, 3130, 0, 3125],
    [184, "West Lake Erie buoy", "Lake Erie", 41.677, -82.398, 3174, 0, 3169],
    [185, "West Lake Superior buoy", "Lake Superior", 47.335, -89.793, 3185, 0, 3180],
    [187, "McGulpin Point North, MI Wave Buoy", "Lake Michigan", 45.803, -84.792, 3311, 3312, 0],
    [250, "Port Washington, WI, USA", "Lake Michigan", 43.317, -87.828, 4828, 4824, 4831],
    [254, "Rawley Point East - CDIP 269", "Lake Michigan", 44.055, -87.05, 4857, 4858, 0],
    [263, "Erie Islands Buoy", "Lake Erie", 41.601, -82.781, 4962, 0, 4956],
    [264, "Grand Island North, MI - CDIP 268", "Lake Superior", 46.973, -86.568, 4965, 4966, 0],
    [265, "Whitefish Point", "Lake Superior", 46.782, -85.071, 4980, 4976, 4983],
    [266, "Lake St. Clair Deep Water Buoy", "Lake St. Clair", 42.432, -82.77, 5016, 4995, 5011],
    [274, "Muskegon", "Lake Michigan", 43.184, -86.358, 5122, 5239, 5125],
    [576, "Shipwreck Sentinel", "Lake Michigan", 43.731, -87.625, 8811, 8831, 8815],
    [577, "Ontonagon, MI", "Lake Superior", 46.932, -89.35, 8895, 8915, 8900],
    [581, "Northern Green Bay Spotter", "Lake Michigan", 45.55, -86.896, 8966, 8970, 8969],
    [609, "Two Rivers, WI, USA", "Lake Michigan", 44.346, -87.446, 4842, 4838, 4845],
    [632, "East Superior Spotter", "Lake Superior", 47.588, -86.588, 9456, 9904, 9459],
    [633, "North Huron Spotter", "Lake Huron", 45.352, -82.845, 9463, 9902, 9466],
    [634, "South Michigan Spotter", "Lake Michigan", 42.674, -87.026, 9470, 9905, 9473],
    [638, "SBSK Point Betsie Spotter", "Lake Michigan", 44.758, -86.261, 5270, 8621, 5273],
    [642, "OTT Wave and Water Level Buoy - Death's Door", "Lake Michigan", 45.299, -86.981, 9623, 9630, 9626],
    [643, "OTT Wave and Water Level Buoy - Oconto", "Lake Michigan", 44.92, -87.731, 9633, 0, 9636],
    [648, "Wave Watch Buoy - Stockton Island", "Lake Superior", 46.903, -90.546, 9709, 9716, 9712],
    [661, "Grand Marais, MN Spotter Buoy", "Lake Superior", 47.676, -90.451, 9882, 10486, 9885],
    [670, "South Haven Spotter", "Lake Michigan", 42.478, -86.304, 9982, 9986, 9985],
    [671, "Grand Haven Spotter", "Lake Michigan", 43.002, -86.271, 9494, 9491, 9497],
    [672, "Whitehall Spotter", "Lake Michigan", 43.457, -86.484, 9520, 9517, 9523],
    [675, "Les Cheneaux", "Lake Huron", 45.921, -84.337, 4801, 4797, 4804],
    [676, "University of Windsor - RAEON Buoy 7 - 2026", "Lake Erie", 41.998, -82.715, 5050, 5053, 5048],
    [679, "CHRP2 Spotter", "Lake Erie", 41.751, -82.124, 10141, 10244, 10148],
    [680, "Ohio St. Beach", "Lake Michigan", 41.894, -87.613, 10155, 10153, 0],
    [685, "Green Bay Wave Buoy EBB", "Lake Michigan", 44.596, -87.946, 10200, 0, 10209],
    [686, "Green Bay Wave Buoy Flo", "Lake Michigan", 44.705, -87.864, 10210, 0, 10219],
    [692, "Crisp Point", "Lake Superior", 46.776, -85.265, 10284, 10289, 10293],
    [693, "Keweenaw Bay", "Lake Superior", 46.832, -88.454, 10296, 10301, 10305],
    [694, "Sand Point", "Lake Superior", 46.778, -88.465, 10308, 10313, 10317],
    [695, "Little Bay de Noc", "Lake Michigan", 45.668, -87.009, 10320, 10325, 10329],
    [698, "New Buffalo Spotter (USACE)", "Lake Michigan", 41.806, -86.753, 10344, 0, 10353],
    [699, "Holland Spotter (USACE)", "Lake Michigan", 42.777, -86.217, 10356, 10361, 10365],
    [700, "Ontonagon Spotter (USACE)", "Lake Superior", 46.88, -89.336, 10368, 0, 10377]
  ];

  /* ---------------------------------------------------------------
   * Utilities
   * ------------------------------------------------------------- */
  var timeFmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TZ });
  var dateKeyFmt = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: TZ });
  function hhmm(d) { return timeFmt.format(d instanceof Date ? d : new Date(d)); }
  function dayKey(d) { return dateKeyFmt.format(d); }
  function ago(t) {
    var m = Math.round((Date.now() - t) / 60000);
    if (m < 1) { return 'just now'; }
    if (m < 60) { return m + ' min ago'; }
    var h = Math.round(m / 60);
    return h + (h === 1 ? ' hr ago' : ' hrs ago');
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) { e.className = cls; }
    if (text != null) { e.textContent = text; }
    return e;
  }
  function $(id) { return document.getElementById(id); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function fetchJSON(url) {
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) { ctrl.abort(); } }, TIMEOUT_MS);
    return fetch(url, ctrl ? { signal: ctrl.signal } : undefined)
      .then(function (res) {
        if (!res.ok) { throw new Error('HTTP ' + res.status); }
        return res.json();
      })
      .then(function (j) { clearTimeout(timer); return j; },
            function (e) { clearTimeout(timer); throw e; });
  }

  var store = {
    get: function (k) { try { var v = localStorage.getItem('mi2:' + k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem('mi2:' + k, JSON.stringify(v)); } catch (e) { /* quota or private mode */ } }
  };

  /* ---------------------------------------------------------------
   * Solar math (computed on device, no network)
   * ------------------------------------------------------------- */
  var RAD = Math.PI / 180;
  function sunPos(date) {
    var n = date.getTime() / 86400000 + 2440587.5 - 2451545.0;
    var L = (280.460 + 0.9856474 * n) % 360;
    var g = (357.528 + 0.9856003 * n) % 360;
    var lam = L + 1.915 * Math.sin(g * RAD) + 0.020 * Math.sin(2 * g * RAD);
    var eps = 23.439 - 0.0000004 * n;
    var ra = Math.atan2(Math.cos(eps * RAD) * Math.sin(lam * RAD), Math.cos(lam * RAD)) / RAD;
    var dec = Math.asin(Math.sin(eps * RAD) * Math.sin(lam * RAD)) / RAD;
    var gmst = ((18.697374558 + 24.06570982441908 * n) % 24 + 24) % 24;
    return { ra: ra, dec: dec, gmst: gmst };
  }
  function sunElev(date, lat, lng) {
    var s = sunPos(date);
    var ha = (s.gmst * 15 + lng - s.ra) * RAD;
    return Math.asin(Math.sin(lat * RAD) * Math.sin(s.dec * RAD) +
      Math.cos(lat * RAD) * Math.cos(s.dec * RAD) * Math.cos(ha)) / RAD;
  }
  /* Scan +/- a day in 2-minute steps for horizon (-0.833 deg) and golden-hour (+6 deg) crossings. */
  function sunEvents(lat, lng, now) {
    var t0 = now.getTime() - 20 * 3600000, t1 = now.getTime() + 30 * 3600000, step = 120000;
    var out = [], prev = sunElev(new Date(t0), lat, lng);
    for (var t = t0 + step; t <= t1; t += step) {
      var e = sunElev(new Date(t), lat, lng);
      [[-0.833, 'rise', 'set'], [6, 'goldEnd', 'goldStart']].forEach(function (th) {
        if (prev < th[0] && e >= th[0]) { out.push({ type: th[1], t: t }); }
        if (prev >= th[0] && e < th[0]) { out.push({ type: th[2], t: t }); }
      });
      prev = e;
    }
    var today = dayKey(now);
    function find(type, pred) { for (var i = 0; i < out.length; i++) { if (out[i].type === type && pred(out[i])) { return new Date(out[i].t); } } return null; }
    var isToday = function (ev) { return dayKey(new Date(ev.t)) === today; };
    var future = function (ev) { return ev.t > now.getTime(); };
    return {
      sunrise: find('rise', isToday), sunset: find('set', isToday),
      goldStart: find('goldStart', isToday),
      nextRise: find('rise', future), nextSet: find('set', future),
      elev: sunElev(now, lat, lng)
    };
  }
  function nightPolygon(date) {
    var s = sunPos(date), subLng = s.ra - s.gmst * 15, pts = [];
    var dec = Math.abs(s.dec) < 0.01 ? 0.01 : s.dec;
    for (var lng = -180; lng <= 180; lng += 2) {
      var ha = (lng - subLng) * RAD;
      var lat = Math.atan(-Math.cos(ha) / Math.tan(dec * RAD)) / RAD;
      pts.push([clamp(lat, -85, 85), lng]);
    }
    var pole = dec < 0 ? 85 : -85;
    pts.push([pole, 180]); pts.push([pole, -180]);
    return pts;
  }

  /* ---------------------------------------------------------------
   * Map
   * ------------------------------------------------------------- */
  var MI_BOUNDS = L.latLngBounds([41.65, -90.45], [48.25, -82.35]);
  var map = L.map('map', {
    zoomControl: false, zoomSnap: 0.25, zoomDelta: 0.5, minZoom: 4.5, maxZoom: 16,
    maxBounds: MI_BOUNDS.pad(0.9), maxBoundsViscosity: 0.8,
    zoomAnimation: !reduceMotion, fadeAnimation: !reduceMotion, markerZoomAnimation: !reduceMotion,
    tap: false
  });
  L.control.zoom({ position: 'topright' }).addTo(map);

  function fitMichigan() {
    var side = sideMQ && sideMQ.matches;
    map.fitBounds(MI_BOUNDS, side
      ? { paddingTopLeft: [400, 70], paddingBottomRight: [20, 20], animate: false }
      : { paddingTopLeft: [8, 60], paddingBottomRight: [8, 100], animate: false });
  }
  fitMichigan();

  var imagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19, maxNativeZoom: 18,
    attribution: 'Tiles &copy; Esri &mdash; Esri, Maxar, Earthstar Geographics'
  }).addTo(map);
  // Visible note when the basemap fails: several tile errors and no successful tile since.
  (function () {
    var errs = 0, msg = document.getElementById('basemap-msg');
    imagery.on('tileerror', function () { errs++; if (errs >= 4 && msg) { msg.hidden = false; } });
    imagery.on('tileload', function () { errs = 0; if (msg) { msg.hidden = true; } });
  })();
  map.createPane('hillshade');
  map.getPane('hillshade').style.zIndex = 250;
  map.getPane('hillshade').classList.add('leaflet-hillshade-pane');
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}', {
    pane: 'hillshade', opacity: 0.3, maxZoom: 19, maxNativeZoom: 16, attribution: 'Hillshade &copy; Esri, USGS'
  }).addTo(map);

  function pane(name, z) {
    var p = map.createPane(name);
    p.style.zIndex = z;
    return p;
  }
  pane('daylight', 300); pane('season', 320); pane('aurora', 330); pane('radar', 340);
  pane('alerts', 410); pane('rivers', 610); pane('buoys', 620); pane('pois', 650); pane('weather', 660);
  map.getPane('aurora').classList.add('aurora-img');
  map.getPane('season').classList.add('season-soft');

  function updateLabels() { map.getContainer().classList.toggle('show-labels', map.getZoom() >= 7); }
  map.on('zoomend', updateLabels); updateLabels();

  /* ---------------------------------------------------------------
   * Bottom sheet (peek / half / full) — side panel on iPad landscape
   * ------------------------------------------------------------- */
  var sheet = $('sheet'), handle = $('sheet-handle'), body = $('sheet-body');
  var SNAPS = ['peek', 'half', 'full'];
  function isSide() { return !!(sideMQ && sideMQ.matches); }
  function setSnap(s) {
    if (s === 'half') { updateHalf(); }
    sheet.setAttribute('data-snap', s);
    sheet.style.transform = '';
    handle.setAttribute('aria-label', s === 'full' ? 'Collapse panel' : 'Expand panel');
    handle.setAttribute('aria-expanded', s === 'peek' ? 'false' : 'true');
  }
  var saProbe = document.createElement('div');
  saProbe.style.cssText = 'position:fixed;left:0;bottom:0;width:0;visibility:hidden;pointer-events:none;height:var(--sa-b)';
  document.body.appendChild(saProbe);
  function halfOffset() {
    var h = sheet.getBoundingClientRect().height, tabs = document.querySelector('.tabs');
    var need = handle.getBoundingClientRect().height + tabs.offsetTop + tabs.offsetHeight + 56 + saProbe.offsetHeight;
    return clamp(h - need, h * 0.2, h * 0.52);
  }
  function updateHalf() { if (!isSide()) { sheet.style.setProperty('--half-y', Math.round(halfOffset()) + 'px'); } }
  window.addEventListener('resize', updateHalf);
  function snapOffset(s) {
    var h = sheet.getBoundingClientRect().height;
    if (s === 'full') { return 0; }
    if (s === 'half') { return halfOffset(); }
    return h - handle.getBoundingClientRect().height - parseFloat(getComputedStyle(sheet).paddingBottom || 0) - 12;
  }
  (function dragSheet() {
    var startY = 0, startOff = 0, lastY = 0, lastT = 0, vel = 0, dragging = false, moved = false, pid = null;
    handle.addEventListener('pointerdown', function (e) {
      if (isSide()) { return; }
      dragging = true; moved = false; pid = e.pointerId;
      startY = lastY = e.clientY; lastT = e.timeStamp;
      startOff = snapOffset(sheet.getAttribute('data-snap'));
      try { handle.setPointerCapture(pid); } catch (err) { /* ignore */ }
    });
    handle.addEventListener('pointermove', function (e) {
      if (!dragging) { return; }
      var dy = e.clientY - startY;
      if (Math.abs(dy) > 6) { moved = true; sheet.classList.add('is-dragging'); }
      if (!moved) { return; }
      var off = clamp(startOff + dy, 0, snapOffset('peek'));
      sheet.style.transform = 'translateY(' + off + 'px)';
      var dt = e.timeStamp - lastT;
      if (dt > 0) { vel = (e.clientY - lastY) / dt; }
      lastY = e.clientY; lastT = e.timeStamp;
    });
    function end(e) {
      if (!dragging) { return; }
      dragging = false;
      sheet.classList.remove('is-dragging');
      try { handle.releasePointerCapture(pid); } catch (err) { /* ignore */ }
      if (!moved) { return; }
      var off = clamp(startOff + (e.clientY - startY), 0, snapOffset('peek'));
      var best = 'peek', bd = Infinity;
      SNAPS.forEach(function (s) {
        var d = Math.abs(snapOffset(s) - (off + vel * 180));
        if (d < bd) { bd = d; best = s; }
      });
      setSnap(best);
      handle.dataset.justDragged = '1';
      setTimeout(function () { handle.dataset.justDragged = ''; }, 50);
    }
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
    handle.addEventListener('click', function () {
      if (isSide() || handle.dataset.justDragged) { return; }
      var cur = sheet.getAttribute('data-snap');
      setSnap(cur === 'peek' ? 'half' : cur === 'half' ? 'full' : 'peek');
    });
  })();
  setSnap('peek');

  /* Tabs */
  var TABS = ['sky', 'water', 'alerts'];
  function showTab(name) {
    TABS.forEach(function (t) {
      $('tab-' + t).setAttribute('aria-selected', t === name ? 'true' : 'false');
      $('pane-' + t).hidden = t !== name;
    });
  }
  TABS.forEach(function (t) {
    $('tab-' + t).addEventListener('click', function () {
      showTab(t);
      if (sheet.getAttribute('data-snap') === 'peek') { setSnap('half'); }
    });
  });

  /* ---------------------------------------------------------------
   * Detail card (full snap) — replaces v1's side desk
   * ------------------------------------------------------------- */
  var activeEl = null, markerById = {}, selected = poiById('lansing');
  function linkLabel(url) {
    try { return 'Visit ' + new URL(url).hostname.replace(/^www\./, '') + ' \u2197'; } catch (e) { return 'Visit site \u2197'; }
  }
  function showDetail(o) {
    $('detail-kicker').textContent = o.kicker || 'Place';
    $('detail-name').textContent = o.title;
    $('detail-line').textContent = o.line || '';
    var facts = $('detail-facts'); facts.innerHTML = '';
    (o.facts || []).forEach(function (f) {
      var s = el('span', 'fact'); s.appendChild(el('b', null, f[0])); s.appendChild(document.createTextNode(f[1])); facts.appendChild(s);
    });
    var pre = $('detail').querySelector('.alert-text');
    if (pre) { pre.remove(); }
    if (o.text) { var p = el('p', 'alert-text', o.text); $('detail-line').after(p); }
    var a = $('detail-link');
    if (o.url) { a.href = o.url; a.textContent = o.linkText || linkLabel(o.url); a.hidden = false; } else { a.hidden = true; }
    $('detail').hidden = false;
    body.scrollTop = 0;
    if (!isSide()) { setSnap('full'); }
  }
  $('detail-close').addEventListener('click', function () {
    $('detail').hidden = true;
    if (activeEl) { activeEl.classList.remove('is-active'); activeEl = null; }
    if (!isSide()) { setSnap('half'); }
  });

  function openPlace(poi) {
    selected = poi;
    var m = markerById[poi.id], e = m && m.getElement();
    if (activeEl) { activeEl.classList.remove('is-active'); }
    activeEl = e || null;
    if (activeEl) { activeEl.classList.add('is-active'); }
    showDetail({ kicker: poi.kind === 'outdoors' ? 'Outdoors' : 'City', title: poi.name, line: poi.line,
      facts: [['Region', poi.region], ['Best for', poi.bestFor]], url: poi.url });
    renderSun();
  }
  function flyTo(lat, lng, z) {
    var zoom = Math.max(map.getZoom(), z || 8);
    if (reduceMotion) { map.setView([lat, lng], zoom, { animate: false }); }
    else { map.flyTo([lat, lng], zoom, { duration: 1.1 }); }
  }

  POIS.forEach(function (poi) {
    var icon = L.divIcon({
      className: 'poi poi--' + poi.kind + ' poi--' + poi.label,
      html: '<span class="poi-dot" aria-hidden="true"></span><span class="poi-label"></span>',
      iconSize: [44, 44], iconAnchor: [22, 22]
    });
    var m = L.marker([poi.lat, poi.lng], { icon: icon, pane: 'pois', keyboard: true, title: poi.name, alt: poi.name }).addTo(map);
    markerById[poi.id] = m;
    var e = m.getElement();
    if (e) { e.querySelector('.poi-label').textContent = poi.name; e.setAttribute('aria-label', poi.name + ' \u2014 open details'); }
    m.on('click', function () { openPlace(poi); });
    m.on('keypress', function (ev) {
      var k = ev.originalEvent && ev.originalEvent.key;
      if (k === 'Enter' || k === ' ') { ev.originalEvent.preventDefault(); openPlace(poi); }
    });
  });

  /* ---------------------------------------------------------------
   * Layer framework: toggle chips, status, cache, dim-on-failure
   * ------------------------------------------------------------- */
  var prefs = store.get('layers') || {};
  var LAYERS = [];
  var S = {};   // id -> state

  function defineLayer(def) {
    LAYERS.push(def);
    S[def.id] = { on: prefs.hasOwnProperty(def.id) ? !!prefs[def.id] : def.def, status: 'idle',
      data: null, fetchedAt: 0, group: L.layerGroup() };
  }

  // Tile-based layers (radar) report tile health: 'down' = tiles failing and none loaded, 'degraded' = several failed.
  function tileHealth(st) {
    var t = st.tiles;
    if (!t || st.status !== 'live') { return ''; }
    if (t.err >= 4 && t.ok === 0) { return 'down'; }
    if (t.err >= 3) { return 'degraded'; }
    return '';
  }
  function effState(st) {
    var h = tileHealth(st);
    return h === 'down' ? 'error' : h === 'degraded' ? 'stale' : st.status;
  }
  function statusText(def, st) {
    if (!st.on) { return 'Off'; }
    if (def.local) { return def.local(st); }
    if (st.status === 'loading') { return 'Updating\u2026'; }
    var th = tileHealth(st);
    if (th === 'down') { return 'Unavailable right now\ntiles not loading'; }
    if (th === 'degraded') { return 'Degraded \u00b7 ' + hhmm(st.fetchedAt) + '\n' + st.tiles.err + ' tiles failed'; }
    if (st.status === 'live') {
      var t = 'Live \u00b7 ' + hhmm(st.fetchedAt);
      var dt = def.dataTime && st.data ? def.dataTime(st.data) : 0;
      return dt ? t + '\nupdated ' + ago(dt) : t;
    }
    if (st.status === 'stale') { return 'Offline \u00b7 saved ' + hhmm(st.fetchedAt); }
    if (st.status === 'error') { return 'Unavailable right now'; }
    return '';
  }

  function chipFor(def) {
    var c = document.querySelector('.chip[data-id="' + def.id + '"]');
    if (c) { return c; }
    c = el('button', 'chip'); c.type = 'button'; c.dataset.id = def.id;
    c.appendChild(el('span', 'sw')); c.appendChild(el('span', 'chip-name', def.name)); c.appendChild(el('span', 'chip-status'));
    c.querySelector('.sw').setAttribute('aria-hidden', 'true');
    c.addEventListener('click', function () { setLayer(def.id, !S[def.id].on); });
    document.querySelector('.chips[data-group="' + def.group + '"]').appendChild(c);
    return c;
  }
  function paint(def) {
    var st = S[def.id], c = chipFor(def);
    c.setAttribute('aria-pressed', st.on ? 'true' : 'false');
    c.dataset.state = st.on ? effState(st) : 'off';
    var txt = statusText(def, st).split('\n');
    var cs = c.querySelector('.chip-status'); cs.innerHTML = '';
    txt.forEach(function (line, i) { if (i) { cs.appendChild(el('br')); } cs.appendChild(document.createTextNode(line)); });
    c.setAttribute('aria-label', def.name + ': ' + (st.on ? 'on' : 'off') + '. ' + txt.join(', '));
    if (def.pane) {
      var p = map.getPane(def.pane);
      if (p) { var es = effState(st); p.classList.toggle('layer-dim', st.on && (es === 'stale' || es === 'error')); }
    }
  }
  function paintAll() { LAYERS.forEach(paint); renderPeek(); }

  function setLayer(id, on) {
    var def = LAYERS.filter(function (d) { return d.id === id; })[0], st = S[id];
    st.on = on; prefs[id] = on; store.set('layers', prefs);
    if (on) {
      st.group.addTo(map);
      if (def.onShow) { def.onShow(st); }
      refreshLayer(def).then(afterRefresh);
    } else {
      map.removeLayer(st.group);
      if (def.onHide) { def.onHide(st); }
      paint(def); afterRefresh();
    }
    paint(def);
  }

  function refreshLayer(def) {
    var st = S[def.id];
    if (!st.on) { return Promise.resolve(); }
    if (!def.fetch) {             // computed locally
      try { def.render(null, st); st.status = 'live'; } catch (e) { st.status = 'error'; }
      paint(def); return Promise.resolve();
    }
    st.status = 'loading'; paint(def);
    return def.fetch().then(function (data) {
      st.data = data; st.fetchedAt = Date.now(); st.status = 'live';
      if (def.cache !== false) { store.set('c:' + def.id, { t: st.fetchedAt, d: def.toCache ? def.toCache(data) : data }); }
      st.group.clearLayers(); def.render(data, st);
      paint(def);
    }).catch(function () {
      var cached = def.cache === false ? null : (st.data ? { t: st.fetchedAt, d: st.data } : store.get('c:' + def.id));
      st.group.clearLayers();
      if (cached && cached.d) {
        st.data = cached.d; st.fetchedAt = cached.t; st.status = 'stale';
        try { def.render(cached.d, st); } catch (e) { st.group.clearLayers(); st.status = 'error'; }
      } else {
        st.data = null; st.status = 'error';
        if (def.onFail) { def.onFail(st); }
      }
      paint(def);
    });
  }

  var lastRefresh = 0, refreshing = false;
  function refreshAll() {
    if (refreshing) { return; }
    refreshing = true; lastRefresh = Date.now();
    $('refresh').classList.toggle('is-spinning', !reduceMotion);
    Promise.all(LAYERS.map(function (d) { return refreshLayer(d).catch(function () {}); }))
      .then(function () { refreshing = false; $('refresh').classList.remove('is-spinning'); afterRefresh(); });
  }
  function afterRefresh() {
    renderPeek(); renderTonight(); renderSun();
    var anyLive = LAYERS.some(function (d) { return S[d.id].on && S[d.id].status === 'live' && d.fetch; });
    var anyOn = LAYERS.some(function (d) { return S[d.id].on && d.fetch; });
    document.querySelector('.brand-dot').classList.toggle('is-stale', anyOn && !anyLive);
  }

  /* ---------------------------------------------------------------
   * Sky: Aurora (NOAA SWPC Kp + OVATION)
   * ------------------------------------------------------------- */
  var KP_URL = 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json';
  var OVATION_URL = 'https://services.swpc.noaa.gov/json/ovation_aurora_latest.json';
  function parseKp(j) {
    var rows = Array.isArray(j) ? j : [];
    var last = null;
    rows.forEach(function (r) {
      if (Array.isArray(r)) { if (r[0] !== 'time_tag' && !isNaN(parseFloat(r[1]))) { last = { t: r[0], kp: parseFloat(r[1]) }; } }
      else if (r && typeof r.Kp === 'number') { last = { t: r.time_tag, kp: r.Kp }; }
    });
    if (!last) { throw new Error('no kp'); }
    return { kp: last.kp, t: Date.parse(String(last.t).replace(' ', 'T') + (/Z|[+-]\d\d:?\d\d$/.test(last.t) ? '' : 'Z')) };
  }
  function auroraDark() { var mq = poiById('marquette'); return sunElev(new Date(), mq.lat, mq.lng) < -6; }
  function kpWords(kp) {
    if (kp >= 7) { return 'Strong storm level (NOAA G3+). Aurora possible across much of Michigan on dark, clear skies.'; }
    if (kp >= 5) { return 'Storm level (NOAA G1\u2013G2). Aurora possible in the U.P., sometimes farther south.'; }
    if (kp >= 4) { return 'Active. A faint glow may show low on the northern horizon in the U.P.'; }
    return 'Quiet. Aurora is unlikely to be seen from Michigan right now.';
  }
  function upMax(pts) {   // highest OVATION probability over the U.P. / Lake Superior
    var m = 0;
    pts.forEach(function (p) { if (p[1] >= 45.5 && p[1] <= 48.5 && p[0] >= -90.5 && p[0] <= -84) { m = Math.max(m, p[2]); } });
    return m;
  }
  defineLayer({
    id: 'aurora', name: 'Aurora', group: 'sky', def: true, pane: 'aurora',
    fetch: function () {
      var dark = auroraDark();
      return Promise.all([fetchJSON(KP_URL), dark ? fetchJSON(OVATION_URL) : Promise.resolve(null)]).then(function (r) {
        var kp = parseKp(r[0]), ov = r[1] || {}, pts = [];
        (ov.coordinates || []).forEach(function (c) {
          var lng = c[0] > 180 ? c[0] - 360 : c[0];
          if (c[2] > 0 && c[1] >= 40 && c[1] <= 60 && lng >= -100 && lng <= -70) { pts.push([lng, c[1], c[2]]); }
        });
        return { kp: kp.kp, kpTime: kp.t, model: !!r[1], obs: r[1] ? (Date.parse(ov['Observation Time']) || Date.now()) : kp.t, pts: pts };
      });
    },
    dataTime: function (d) { return d.obs; },
    render: function (d, st) {
      d.pts.forEach(function (p) {
        var a = clamp(p[2] / 30, 0.06, 0.8);
        st.group.addLayer(L.rectangle([[p[1] - 0.5, p[0] - 0.5], [p[1] + 0.5, p[0] + 0.5]], {
          pane: 'aurora', stroke: false, interactive: false,
          fillColor: p[2] >= 20 ? '#c08cff' : p[2] >= 8 ? '#7dffc8' : '#3dffa0', fillOpacity: a
        }));
      });
      setVeil(d.kp);
      renderKpCard(d, st);
    },
    onShow: function () { $('kp-card').hidden = false; },
    onHide: function () { setVeil(0); $('kp-card').hidden = true; },
    onFail: function () { setVeil(0); renderKpCard(null); }
  });
  function setVeil(kp) {
    document.documentElement.style.setProperty('--kp-alpha', String(clamp((kp - 2) / 5, 0, 0.85)));
  }
  function renderKpCard(d, st) {
    var c = $('kp-card'); c.innerHTML = ''; c.hidden = !S.aurora.on;
    if (!d) { c.appendChild(el('p', 'muted', 'Aurora data unavailable right now.')); return; }
    var kpR = Math.round(d.kp);
    c.appendChild(el('p', 'kicker', 'Aurora \u00b7 NOAA SWPC'));
    c.appendChild(el('p', 'big', 'Kp ' + kpR + (kpR >= 5 ? ', aurora possible in the U.P.' : '')));
    var bar = el('div', 'kp-bar'), tick = el('i'); tick.style.left = 'calc(' + clamp(d.kp / 9 * 100, 0, 100) + '% - 2px)';
    bar.appendChild(tick); bar.setAttribute('aria-hidden', 'true'); c.appendChild(bar);
    c.appendChild(el('p', null, kpWords(d.kp)));
    c.appendChild(el('p', 'muted small', (d.model
      ? 'OVATION model: up to ' + upMax(d.pts) + '% chance overhead in the U.P. \u00b7 Kp from ' + hhmm(d.kpTime) + ' ET \u00b7 model updated ' + ago(d.obs)
      : 'Kp from ' + hhmm(d.kpTime) + ' ET \u00b7 the aurora model loads after dark') + (st && st.status === 'stale' ? ' (saved)' : '')));
  }

  /* ---------------------------------------------------------------
   * Sky: Weather (Open-Meteo)
   * ------------------------------------------------------------- */
  var WMO = { 0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Rime fog',
    51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle', 56: 'Freezing drizzle', 57: 'Freezing drizzle',
    61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 66: 'Freezing rain', 67: 'Freezing rain',
    71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains', 80: 'Showers', 81: 'Showers', 82: 'Heavy showers',
    85: 'Snow showers', 86: 'Snow showers', 95: 'Thunderstorm', 96: 'T-storm, hail', 99: 'T-storm, hail' };
  function tempColor(f) {
    if (f <= 20) { return '#9cc8ff'; } if (f <= 40) { return '#7fe3ff'; } if (f <= 60) { return '#9dffc8'; }
    if (f <= 80) { return '#ffd36e'; } return '#ff8c5a';
  }
  defineLayer({
    id: 'weather', name: 'Weather', group: 'sky', def: true, pane: 'weather',
    fetch: function () {
      var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + WEATHER_SPOTS.map(function (s) { return s.lat; }).join(',') +
        '&longitude=' + WEATHER_SPOTS.map(function (s) { return s.lng; }).join(',') +
        '&current=temperature_2m,weather_code,wind_speed_10m,cloud_cover' +
        '&hourly=temperature_2m,precipitation_probability,weather_code&forecast_hours=4' +
        '&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FDetroit&timeformat=unixtime';
      return fetchJSON(url).then(function (j) {
        var rows = Array.isArray(j) ? j : [j];
        if (rows.length !== WEATHER_SPOTS.length) { throw new Error('bad payload'); }
        return rows.map(function (r, i) {
          var c = r.current || {}, h = r.hourly || {};
          if (typeof c.temperature_2m !== 'number') { throw new Error('no current'); }
          var next = [];
          for (var k = 1; k < (h.time || []).length && next.length < 3; k++) {
            next.push({ t: h.time[k] * 1000, f: h.temperature_2m[k], p: h.precipitation_probability ? h.precipitation_probability[k] : null });
          }
          return { i: i, f: c.temperature_2m, code: c.weather_code, wind: c.wind_speed_10m, cloud: c.cloud_cover, t: c.time * 1000, next: next };
        });
      });
    },
    dataTime: function (d) { return d[0] && d[0].t; },
    render: function (d, st) {
      var list = $('wx-list'); list.innerHTML = '';
      d.forEach(function (w) {
        var s = WEATHER_SPOTS[w.i], col = tempColor(w.f);
        var off = s.badge || [-22, -66], mt = off[1] <= -44 ? 20 : off[1] >= 22 ? 0 : 10;
        var html = '<span style="display:inline-block;margin-top:' + mt + 'px;padding:2px 7px;border-radius:9px;background:rgba(4,7,15,.8);border:1px solid ' + col +
          ';color:' + col + ';font-weight:700;font-size:13px;box-shadow:0 0 10px ' + col + '66">' + Math.round(w.f) + '\u00b0</span>';
        var m = L.marker([s.lat, s.lng], { pane: 'weather', icon: L.divIcon({ className: 'dm', html: html, iconSize: [44, 44], iconAnchor: [-off[0], -off[1]] }),
          keyboard: false, title: s.name + ' weather' });
        var nxt = w.next.map(function (n) { return hhmm(n.t) + ' ' + Math.round(n.f) + '\u00b0' + (n.p != null ? ' (' + n.p + '% precip)' : ''); }).join('<br>');
        m.bindPopup('<b>' + s.name + '</b><br>' + (WMO[w.code] || 'Conditions n/a') + ', ' + Math.round(w.f) + '\u00b0F, wind ' +
          Math.round(w.wind) + ' mph<br>' + nxt + '<br><span style="color:#a9b8cc">updated ' + ago(w.t) + '</span>');
        st.group.addLayer(m);
        var li = el('li', 'wx'); li.appendChild(el('b', null, s.name));
        li.appendChild(el('span', 't', Math.round(w.f) + '\u00b0F'));
        li.appendChild(el('span', 's', ' ' + (WMO[w.code] || '')));
        var n0 = w.next[w.next.length - 1];
        if (n0) { li.appendChild(el('div', 's', 'By ' + hhmm(n0.t) + ': ' + Math.round(n0.f) + '\u00b0' + (n0.p != null ? ', ' + n0.p + '% precip' : ''))); }
        list.appendChild(li);
      });
    },
    onHide: function () { $('wx-list').innerHTML = ''; },
    onFail: function () { $('wx-list').innerHTML = ''; }
  });

  /* ---------------------------------------------------------------
   * Sky: Radar (RainViewer public, keyless). Last ~1 hour, play/pause.
   * ------------------------------------------------------------- */
  var radar = { frames: [], layers: [], idx: 0, timer: null, playing: false, tiles: [], st: null, def: null };
  // Tile counters are kept per frame and rebuilt on every refresh. The chip reads only the frame on screen, so a frame
  // change or a refresh starts it from that frame's own fresh counts; old failures don't stick.
  function radarTiles(i) {
    var st = radar.st;
    if (!st) { return; }
    var prev = st.tiles, cur = radar.tiles[i] || { ok: 0, err: 0 };
    st.tiles = cur;
    if (prev !== cur && radar.def && (!prev || prev.ok !== cur.ok || prev.err !== cur.err)) { paint(radar.def); }
  }
  function radarShow(i) {
    radar.idx = i;
    radar.layers.forEach(function (l, k) { l.setOpacity(k === i ? 0.7 : 0); });
    var f = radar.frames[i];
    if (f) { $('radar-time').textContent = 'Radar ' + hhmm(f.time * 1000) + (i === radar.frames.length - 1 ? ' (latest)' : ''); }
    radarTiles(i);
  }
  function radarPlay(on) {
    radar.playing = on;
    $('radar-play').textContent = on ? 'Pause' : 'Play';
    $('radar-play').setAttribute('aria-label', on ? 'Pause radar loop' : 'Play radar loop');
    clearInterval(radar.timer); radar.timer = null;
    if (on && radar.frames.length > 1) {
      radar.timer = setInterval(function () {
        if (document.hidden) { return; }
        radarShow((radar.idx + 1) % radar.frames.length);
      }, 700);
    }
  }
  $('radar-play').addEventListener('click', function () { radarPlay(!radar.playing); });
  defineLayer({
    id: 'radar', name: 'Radar', group: 'sky', def: false, pane: 'radar', cache: false,
    fetch: function () {
      return fetchJSON('https://api.rainviewer.com/public/weather-maps.json').then(function (j) {
        var past = (j.radar && j.radar.past) || [];
        if (!j.host || !past.length) { throw new Error('no frames'); }
        return { host: j.host, frames: past.slice(-7) };
      });
    },
    dataTime: function (d) { return d.frames[d.frames.length - 1].time * 1000; },
    render: function (d, st) {
      radar.frames = d.frames;
      var counts = radar.tiles = d.frames.map(function () { return { ok: 0, err: 0 }; });
      radar.st = st; radar.def = this; st.tiles = null;
      var def = this, pending = null;
      function tick(k, ok) {
        if (ok) { counts[k].ok++; } else { counts[k].err++; }
        if (!pending) { pending = setTimeout(function () { pending = null; paint(def); }, 300); }
      }
      radar.layers = d.frames.map(function (f, k) {
        var l = L.tileLayer(d.host + f.path + '/256/{z}/{x}/{y}/2/1_1.png', {
          pane: 'radar', opacity: 0, maxNativeZoom: 7, maxZoom: 16, attribution: 'Radar &copy; RainViewer'
        });
        l.on('tileload', function () { tick(k, true); });
        l.on('tileerror', function () { tick(k, false); });
        st.group.addLayer(l);
        return l;
      });
      radarShow(radar.frames.length - 1);
      $('radar-ctl').hidden = false;
      radarPlay(!reduceMotion);
    },
    onShow: function () { $('radar-ctl').hidden = false; $('radar-time').textContent = 'Radar loading\u2026'; },
    onHide: function () { radarPlay(false); $('radar-ctl').hidden = true; },
    onFail: function () { radarPlay(false); $('radar-ctl').hidden = true; }
  });

  /* ---------------------------------------------------------------
   * Sky: Daylight (computed) + Season tints (typical timing)
   * ------------------------------------------------------------- */
  defineLayer({
    id: 'daylight', name: 'Daylight', group: 'sky', def: true, pane: 'daylight',
    local: function () { return 'Live \u00b7 computed on device'; },
    render: function (d, st) {
      st.group.clearLayers();
      st.group.addLayer(L.polygon(nightPolygon(new Date()), {
        pane: 'daylight', interactive: false, color: '#5ee7ff', weight: 1.5, opacity: 0.6,
        fillColor: '#000814', fillOpacity: 0.38
      }));
      renderSun();
    },
    onShow: function () { $('sun-card').hidden = false; },
    onHide: function () { $('sun-card').hidden = true; }
  });
  function renderSun() {
    var c = $('sun-card');
    if (!S.daylight || !S.daylight.on) { c.hidden = true; return; }
    var p = selected || poiById('lansing'), now = new Date(), ev = sunEvents(p.lat, p.lng, now);
    c.hidden = false; c.innerHTML = '';
    c.appendChild(el('p', 'kicker', 'Daylight \u00b7 ' + p.name));
    var up = ev.elev > -0.833;
    c.appendChild(el('p', 'big', up
      ? (ev.nextSet ? 'Sunset ' + hhmm(ev.nextSet) + ' ET' : 'Sun is up')
      : (ev.nextRise ? 'Sunrise ' + hhmm(ev.nextRise) + ' ET' : 'Sun is down')));
    var parts = [];
    if (ev.sunrise) { parts.push('Rise ' + hhmm(ev.sunrise)); }
    if (ev.sunset) { parts.push('Set ' + hhmm(ev.sunset)); }
    if (ev.goldStart) { parts.push('Golden hour from ' + hhmm(ev.goldStart)); }
    c.appendChild(el('p', 'muted small', (parts.length ? 'Today: ' + parts.join(' \u00b7 ') + ' ET. ' : '') + 'Computed on this device.'));
  }

  var SEASONAL = window.MI_SEASONAL || { picks: [], tints: {}, seasonOf: function () { return 'fall'; }, labels: {} };
  var month = new Date().getMonth(), season = SEASONAL.seasonOf(month);
  defineLayer({
    id: 'season', name: 'Season: ' + (SEASONAL.labels[season] || ''), group: 'sky', def: true, pane: 'season',
    local: function () { return 'Typical timing'; },
    render: function (d, st) {
      st.group.clearLayers();
      (SEASONAL.tints[season] || []).forEach(function (t) {
        var now = t.months.indexOf(month) >= 0;
        var r = L.rectangle([[t.box[0], t.box[1]], [t.box[2], t.box[3]]], {
          pane: 'season', stroke: false,
          fillColor: now ? '#ff9a3d' : '#b48cff', fillOpacity: now ? 0.22 : 0.08
        });
        r.bindPopup('<b>' + t.name + '</b><br>' + t.tip + '<br><span style="color:#a9b8cc">Typical timing, not a forecast.</span>');
        st.group.addLayer(r);
      });
    }
  });

  /* ---------------------------------------------------------------
   * Water: Great Lakes buoys (GLOS Seagull obs-latest, keyless, CORS *)
   * ------------------------------------------------------------- */
  var BUOY_MAX_AGE = 3 * 3600 * 1000;
  function buoyName(n) {
    return String(n).replace(/\s*[-\u2013]\s*(19|20)\d\d\b/g, '').replace(/\s*\((USACE)\)/, '').replace(/\s+-\s+/g, ' ').trim();
  }
  function ktoF(v) { return v > 150 ? (v - 273.15) * 9 / 5 + 32 : v * 9 / 5 + 32; }
  defineLayer({
    id: 'buoys', name: 'Lake buoys', group: 'water', def: false, pane: 'buoys',
    fetch: function () {
      return fetchJSON('https://seagull-api.glos.org/api/v2/obs-latest').then(function (j) {
        var byId = {};
        (Array.isArray(j) ? j : []).forEach(function (d) {
          var p = {}; (d.parameters || []).forEach(function (x) { if (x.observations && x.observations[0]) { p[x.parameter_id] = x.observations[0]; } });
          byId[d.obs_dataset_id] = p;
        });
        var now = Date.now(), out = [];
        BUOYS.forEach(function (b) {
          var p = byId[b[0]]; if (!p) { return; }
          function fresh(id) { var o = id && p[id]; return o && typeof o.value === 'number' && now - o.timestamp * 1000 < BUOY_MAX_AGE ? o : null; }
          var w = fresh(b[5]), t = fresh(b[6]), k = fresh(b[7]);
          if (!w && !t) { return; }
          var ts = Math.max(w ? w.timestamp : 0, t ? t.timestamp : 0, k ? k.timestamp : 0) * 1000;
          out.push({ id: b[0], ft: w ? Math.round(w.value * 3.28084 * 10) / 10 : null,
            wf: t ? Math.round(ktoF(t.value)) : null, mph: k ? Math.round(k.value * 2.23694) : null, ts: ts });
        });
        if (!out.length) { throw new Error('no fresh buoys'); }
        return out;
      });
    },
    dataTime: function (d) { return Math.max.apply(null, d.map(function (x) { return x.ts; })); },
    render: function (d, st) {
      var meta = {}; BUOYS.forEach(function (b) { meta[b[0]] = b; });
      d.forEach(function (x) {
        var b = meta[x.id]; if (!b) { return; }
        var ft = x.ft == null ? 0 : x.ft;
        var size = Math.round(clamp(8 + ft * 3, 8, 24));
        var html = '<i style="width:' + size + 'px;height:' + size + 'px;--g:' + Math.round(6 + ft * 6) + 'px;--dur:' +
          clamp(3.2 - ft * 0.4, 0.9, 3.2).toFixed(1) + 's' + (x.ft == null ? ';opacity:.55' : '') + '"></i>';
        var m = L.marker([b[3], b[4]], { pane: 'buoys', icon: L.divIcon({ className: 'dm buoy', html: html, iconSize: [44, 44], iconAnchor: [22, 22] }), title: buoyName(b[1]) });
        var lines = [];
        if (x.ft != null) { lines.push('Waves ' + x.ft + ' ft'); }
        if (x.wf != null) { lines.push('Water ' + x.wf + '\u00b0F'); }
        if (x.mph != null) { lines.push('Wind ' + x.mph + ' mph'); }
        m.bindPopup('<b>' + buoyName(b[1]) + '</b><br>' + b[2] + '<br>' + lines.join(' \u00b7 ') + '<br><span style="color:#a9b8cc">reading ' +
          hhmm(x.ts) + ' ET, ' + ago(x.ts) + ' (GLOS)</span>');
        st.group.addLayer(m);
      });
      renderWater();
    },
    onHide: function () { renderWater(); }, onFail: function () { renderWater(); }
  });
  function lakeStats() {
    var st = S.buoys; if (!st || !st.on || !st.data) { return null; }
    var meta = {}; BUOYS.forEach(function (b) { meta[b[0]] = b; });
    var lakes = {};
    st.data.forEach(function (x) {
      if (x.ft == null || !meta[x.id]) { return; }
      var n = meta[x.id][2]; (lakes[n] = lakes[n] || []).push(x.ft);
    });
    var out = Object.keys(lakes).map(function (n) {
      var a = lakes[n].sort(function (p, q) { return p - q; });
      return { lake: n, median: a[Math.floor(a.length / 2)], n: a.length, max: a[a.length - 1] };
    }).filter(function (l) { return l.n >= 2; });
    out.sort(function (p, q) { return p.median - q.median; });
    return out;
  }
  function renderWater() {
    var c = $('water-summary'), list = $('water-list');
    c.innerHTML = ''; list.innerHTML = '';
    var ls = lakeStats();
    if (ls && ls.length) {
      c.hidden = false;
      c.appendChild(el('p', 'kicker', 'Waves by lake \u00b7 GLOS buoys'));
      c.appendChild(el('p', 'big', 'Calmest: ' + ls[0].lake + ', ' + ls[0].median + ' ft'));
      c.appendChild(el('p', 'muted small', 'Median significant wave height of buoys reporting in the last 3 hours. Bigger, faster-pulsing dots mean bigger waves.'));
      ls.forEach(function (l) {
        var li = el('li'), b = el('button'); b.type = 'button';
        b.appendChild(el('span', 'item-title', l.lake + ': ' + l.median + ' ft median'));
        b.appendChild(el('span', 'item-sub', l.n + ' buoys \u00b7 up to ' + l.max + ' ft'));
        b.addEventListener('click', function () {
          var meta = BUOYS.filter(function (x) { return x[2] === l.lake; });
          if (meta.length) { map.fitBounds(L.latLngBounds(meta.map(function (x) { return [x[3], x[4]]; })).pad(0.2)); }
        });
        li.appendChild(b); list.appendChild(li);
      });
    } else { c.hidden = true; }
    var r = S.rivers;
    if (r && r.on && r.data) {
      var up = r.data.filter(function (g) { return g.cls === 'up'; }).sort(function (a, b) { return b.pct - a.pct; });
      var li2 = el('li'), d = el('div', 'card now');
      d.appendChild(el('p', 'kicker', 'Rivers \u00b7 USGS'));
      d.appendChild(el('p', null, r.data.length + ' gauges reporting \u00b7 ' + up.length + ' rising more than 10% in 3 hrs'));
      if (up[0]) { d.appendChild(el('p', 'muted small', 'Fastest rise: ' + up[0].name + ' (+' + up[0].pct + '%)')); }
      li2.appendChild(d); list.appendChild(li2);
    }
  }

  /* ---------------------------------------------------------------
   * Water: Rivers (USGS NWIS instantaneous values, streamflow 00060, last 3 h)
   * ------------------------------------------------------------- */
  function titleCase(s) { return s.toLowerCase().replace(/\b([a-z])/g, function (m) { return m.toUpperCase(); }).replace(/\bMi\b/, 'MI'); }
  defineLayer({
    id: 'rivers', name: 'River gauges', group: 'water', def: false, pane: 'rivers',
    fetch: function () {
      return fetchJSON('https://waterservices.usgs.gov/nwis/iv/?format=json&stateCd=mi&parameterCd=00060&siteStatus=active&period=PT3H')
        .then(function (j) {
          var out = [];
          ((j.value && j.value.timeSeries) || []).forEach(function (ts) {
            var si = ts.sourceInfo || {}, g = si.geoLocation && si.geoLocation.geogLocation;
            var nd = ts.variable && ts.variable.noDataValue;
            var vals = ((ts.values && ts.values[0] && ts.values[0].value) || []).filter(function (v) { var n = parseFloat(v.value); return !isNaN(n) && n !== nd && n >= 0; });
            if (!g || vals.length < 1) { return; }
            var first = parseFloat(vals[0].value), last = parseFloat(vals[vals.length - 1].value);
            var pct = first > 0 ? Math.round((last - first) / first * 100) : 0;
            out.push({ name: titleCase(si.siteName || 'Gauge'), lat: g.latitude, lng: g.longitude, cfs: last, pct: pct,
              cls: pct >= 10 ? 'up' : pct <= -10 ? 'down' : 'flat', t: Date.parse(vals[vals.length - 1].dateTime) });
          });
          if (!out.length) { throw new Error('no gauges'); }
          return out;
        });
    },
    dataTime: function (d) { return Math.max.apply(null, d.map(function (x) { return x.t || 0; })); },
    render: function (d, st) {
      d.forEach(function (g) {
        var m = L.marker([g.lat, g.lng], { pane: 'rivers', icon: L.divIcon({ className: 'dm gauge ' + g.cls, html: '<i></i>', iconSize: [44, 44], iconAnchor: [22, 22] }), title: g.name });
        m.bindPopup('<b>' + g.name + '</b><br>Flow ' + Math.round(g.cfs).toLocaleString('en-US') + ' ft\u00b3/s \u00b7 ' +
          (g.pct > 0 ? 'up ' : g.pct < 0 ? 'down ' : 'steady ') + (g.pct ? Math.abs(g.pct) + '% ' : '') + 'in 3 hrs<br>' +
          '<span style="color:#a9b8cc">reading ' + hhmm(g.t) + ' ET, ' + ago(g.t) + ' (USGS, provisional)</span>');
        st.group.addLayer(m);
      });
      renderWater();
    },
    onHide: function () { renderWater(); }, onFail: function () { renderWater(); }
  });

  /* ---------------------------------------------------------------
   * Alerts: NWS active alerts for MI, polygons or zone outlines
   * ------------------------------------------------------------- */
  var zoneCache = {};
  var ZONE_TTL = 7 * 24 * 3600 * 1000, ZONE_MAX_REQ = 40;
  function zoneKeep(url) { return /\/(MI[ZC]\d+|L[MSHE]Z\d+)$/.test(url); }   // drop Indiana and other states' zones
  function roundLL(polys) { return polys.map(function (poly) { return poly.map(function (ring) { return ring.map(function (c) { return [Math.round(c[0] * 1000) / 1000, Math.round(c[1] * 1000) / 1000]; }); }); }); }
  var SEV_COLOR = { Extreme: '#ff4d4d', Severe: '#ff5c5c', Moderate: '#ff9a3d', Minor: '#ffc857', Unknown: '#ffc857' };
  function decimate(ring, max) {
    if (ring.length <= max) { return ring; }
    var step = Math.ceil(ring.length / max), out = [];
    for (var i = 0; i < ring.length; i += step) { out.push(ring[i]); }
    out.push(ring[ring.length - 1]);
    return out;
  }
  function geomToLatLngs(g) {
    if (!g) { return null; }
    var polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
    return polys.map(function (poly) { return poly.map(function (ring) { return decimate(ring, 160).map(function (c) { return [c[1], c[0]]; }); }); });
  }
  function zoneKey(url) { return 'z:' + url.split('/').slice(-2).join('/'); }
  function zoneFromDevice(url) {
    if (zoneCache[url]) { return zoneCache[url]; }
    var c = store.get(zoneKey(url));
    if (c && c.ll && Date.now() - c.t < ZONE_TTL) { zoneCache[url] = c.ll; return c.ll; }
    return null;
  }
  // areaDesc is "; "-joined names in geocode.UGC order. Keep only names whose UGC code is a Michigan or
  // Great Lakes marine zone. Only when the lists line up exactly; otherwise show NWS's text unchanged.
  function miArea(p) {
    var desc = p.areaDesc || '', ugc = (p.geocode && p.geocode.UGC) || [], names = desc.split('; ');
    var zones = (p.affectedZones || []).map(function (u) { return u.split('/').pop(); });
    if (!ugc.length || names.length !== ugc.length || zones.join() !== ugc.join()) { return desc; }
    var keep = names.filter(function (n, i) { return zoneKeep('/' + ugc[i]); });
    return keep.length ? keep.join('; ') : desc;
  }
  function getZone(url) {
    var have = zoneFromDevice(url);
    if (have) { return Promise.resolve(have); }
    return fetchJSON(url).then(function (z) {
      var ll = roundLL(geomToLatLngs(z.geometry) || []);
      zoneCache[url] = ll; store.set(zoneKey(url), { t: Date.now(), ll: ll });
      return ll;
    }).catch(function () { return null; });
  }
  function pool(items, n, fn) {
    var i = 0, res = new Array(items.length);
    function next() { if (i >= items.length) { return Promise.resolve(); } var k = i++; return fn(items[k]).then(function (r) { res[k] = r; return next(); }); }
    var ws = []; for (var w = 0; w < Math.min(n, items.length); w++) { ws.push(next()); }
    return Promise.all(ws).then(function () { return res; });
  }
  defineLayer({
    id: 'alerts', name: 'NWS alerts', group: 'alerts', def: true, pane: 'alerts',
    fetch: function () {
      return fetchJSON('https://api.weather.gov/alerts/active?area=MI').then(function (j) {
        var feats = (j.features || []).map(function (f) {
          var p = f.properties || {};
          return { id: p.id || f.id, event: p.event || 'Alert', severity: p.severity || 'Unknown', headline: p.headline || '',
            area: miArea(p), sent: Date.parse(p.sent) || 0, ends: Date.parse(p.ends || p.expires) || 0,
            text: [p.description, p.instruction].filter(Boolean).join('\n\n'), sender: p.senderName || 'NWS',
            geom: geomToLatLngs(f.geometry), zones: f.geometry ? [] : (p.affectedZones || []).filter(zoneKeep) };
        });
        var urls = [];
        feats.forEach(function (a) { a.zones.forEach(function (z) { if (urls.indexOf(z) < 0) { urls.push(z); } }); });
        var need = urls.filter(function (u) { return !zoneFromDevice(u); }).slice(0, ZONE_MAX_REQ);
        return pool(need, 6, getZone).then(function () {
          return { updated: Date.parse(j.updated) || Date.now(), alerts: feats };
        });
      });
    },
    toCache: function (d) {   // keep the list, drop geometry
      return { updated: d.updated, alerts: d.alerts.map(function (a) { var c = {}; for (var k in a) { if (k !== 'geom') { c[k] = a[k]; } } return c; }) };
    },
    dataTime: function (d) { return d.updated; },
    render: function (d, st) {
      var order = { Extreme: 0, Severe: 1, Moderate: 2, Minor: 3, Unknown: 4 };
      var rank = function (x) { return order.hasOwnProperty(x) ? order[x] : 4; };
      d.alerts.sort(function (a, b) { return rank(a.severity) - rank(b.severity); });
      d.alerts.slice().reverse().forEach(function (a) {
        var col = SEV_COLOR[a.severity] || SEV_COLOR.Unknown;
        var shapes = a.geom ? [a.geom] : a.zones.map(function (z) { return zoneFromDevice(z); }).filter(Boolean);
        shapes.forEach(function (ll) {
          var poly = L.polygon(ll, { pane: 'alerts', color: col, weight: a.severity === 'Minor' ? 1.5 : 2.5, opacity: 0.95,
            fillColor: col, fillOpacity: 0.1, className: 'alert-glow' });
          poly.on('click', function () { openAlert(a); });
          st.group.addLayer(poly);
        });
      });
      renderAlertList(d.alerts, st);
    },
    onHide: function () { renderAlertList([], null); }, onFail: function () { renderAlertList(null, null); }
  });
  function openAlert(a) {
    showDetail({ kicker: a.severity + ' \u00b7 ' + a.sender, title: a.event, line: a.area,
      facts: [['Issued', hhmm(a.sent) + ' ET'], ['Until', a.ends ? hhmm(a.ends) + ' ET' : 'further notice']],
      text: a.text || a.headline });
  }
  function renderAlertList(alerts, st) {
    var ul = $('alert-list'), cnt = $('alert-count'); ul.innerHTML = '';
    if (alerts && alerts.length) { cnt.textContent = alerts.length; cnt.hidden = false; } else { cnt.hidden = true; }
    if (!S.alerts.on) { return; }
    if (!alerts) { ul.appendChild(el('li', 'muted', 'NWS alerts are unavailable right now.')); return; }
    if (!alerts.length) { ul.appendChild(el('li', 'muted', 'No active NWS alerts for Michigan.')); return; }
    alerts.forEach(function (a) {
      var li = el('li'), b = el('button', 'sev-' + a.severity); b.type = 'button';
      b.appendChild(el('span', 'item-title', a.event));
      b.appendChild(el('span', 'item-sub', a.area.length > 110 ? a.area.slice(0, 107) + '\u2026' : a.area));
      b.appendChild(el('span', 'item-sub', a.severity + (a.ends ? ' \u00b7 until ' + hhmm(a.ends) + ' ET' : '')));
      b.addEventListener('click', function () { openAlert(a); });
      li.appendChild(b); ul.appendChild(li);
    });
  }

  /* ---------------------------------------------------------------
   * Peek line
   * ------------------------------------------------------------- */
  function renderPeek() {
    var parts = [];
    var a = S.aurora;
    if (a.on && a.data) { parts.push('Kp ' + Math.round(a.data.kp) + (a.status === 'stale' ? ' (saved)' : '')); }
    else if (a.on && a.status === 'error') { parts.push('Kp offline'); }
    var al = S.alerts;
    if (al.on && al.data) { var n = al.data.alerts.length; parts.push(n + ' NWS alert' + (n === 1 ? '' : 's') + (al.status === 'stale' ? ' (saved)' : '')); }
    else if (al.on && al.status === 'error') { parts.push('Alerts offline'); }
    var p = selected || poiById('lansing'), ev = sunEvents(p.lat, p.lng, new Date());
    if (ev.elev > -0.833 && ev.nextSet) { parts.push('sunset ' + hhmm(ev.nextSet) + ' ET'); }
    else if (ev.nextRise) { parts.push('sunrise ' + hhmm(ev.nextRise) + ' ET'); }
    $('peek-line').textContent = parts.join(' \u2022 ') || 'Michigan, live';
  }

  /* ---------------------------------------------------------------
   * Tonight in Michigan — one pick from data already fetched, simple rules
   * ------------------------------------------------------------- */
  var tonightTarget = null;
  function setTonight(title, line, target, link) {
    $('tonight-title').textContent = title;
    $('tonight-line').textContent = line;
    tonightTarget = target;
    var a = $('tonight-link');
    if (link) { a.href = link.url; a.textContent = link.text; a.hidden = false; } else { a.hidden = true; }
  }
  function renderTonight() {
    try {
      var now = new Date(), mq = poiById('marquette');
      var a = S.aurora.on && S.aurora.status === 'live' ? S.aurora.data : null;
      var darkMq = sunElev(now, mq.lat, mq.lng) < -12;
      if (a && a.model && darkMq) {
        var pct = upMax(a.pts);
        if (pct >= 10 || a.kp >= 5) {
          var wx = S.weather.status === 'live' && S.weather.data ? S.weather.data[5] : null;
          var cloud = wx && typeof wx.cloud === 'number' ? ' Cloud cover at Marquette: ' + wx.cloud + '%.' : '';
          setTonight('Aurora chance over the U.P.', 'NOAA shows Kp ' + Math.round(a.kp) + ' and up to ' + pct +
            '% aurora probability near Marquette right now. Look north from a dark spot.' + cloud,
            { lat: mq.lat, lng: mq.lng, z: 7, poi: mq },
            { url: 'https://www.swpc.noaa.gov/products/aurora-30-minute-forecast', text: 'NOAA aurora \u2197' });
          return;
        }
      }
      var al = S.alerts.on && S.alerts.status === 'live' ? S.alerts.data : null;
      var big = al ? al.alerts.filter(function (x) { return x.severity === 'Severe' || x.severity === 'Extreme'; }) : [];
      if (big.length) {
        var x = big[0];
        setTonight('Heads up: ' + x.event, x.area.slice(0, 140) + (x.ends ? ' \u00b7 until ' + hhmm(x.ends) + ' ET' : ''), { alert: x }, null);
        return;
      }
      var ls = S.buoys.status === 'live' ? lakeStats() : null;
      if (ls && ls.length) {
        var meta = BUOYS.filter(function (b) { return b[2] === ls[0].lake; });
        var c = meta.length ? L.latLngBounds(meta.map(function (b) { return [b[3], b[4]]; })).getCenter() : null;
        setTonight('Calmest lake: ' + ls[0].lake + ', ' + ls[0].median + ' ft waves',
          'Median of ' + ls[0].n + ' GLOS buoys reporting in the last 3 hours.', c ? { lat: c.lat, lng: c.lng, z: 7 } : null, null);
        return;
      }
      var sb = poiById('sleeping-bear'), tq = poiById('tahquamenon');
      var evSb = sunEvents(sb.lat, sb.lng, now);
      if (evSb.elev > -0.833 && evSb.nextSet) {
        setTonight('Sunset at Sleeping Bear: ' + hhmm(evSb.nextSet) + ' ET', 'Computed for the dunes above Lake Michigan. Clear west views from the Empire Bluff and Pierce Stocking overlooks.',
          { lat: sb.lat, lng: sb.lng, z: 9, poi: sb }, { url: sb.url, text: linkLabel(sb.url) });
        return;
      }
      var evTq = sunEvents(tq.lat, tq.lng, now);
      if (evTq.nextRise) {
        var auroraNote = a && a.model ? ' Aurora data shows nothing notable over Michigan right now.' : '';
        setTonight('Next sunrise at Tahquamenon Falls: ' + hhmm(evTq.nextRise) + ' ET', 'Computed for the Upper Falls.' + auroraNote,
          { lat: tq.lat, lng: tq.lng, z: 9, poi: tq }, { url: tq.url, text: linkLabel(tq.url) });
        return;
      }
      throw new Error('no pick');
    } catch (e) {
      var f = poiById('sleeping-bear');
      setTonight(f.name, f.line, { lat: f.lat, lng: f.lng, z: 9, poi: f }, { url: f.url, text: linkLabel(f.url) });
    }
  }
  $('tonight-go').addEventListener('click', function () {
    var t = tonightTarget; if (!t) { return; }
    if (t.alert) { openAlert(t.alert); showTab('alerts'); return; }
    flyTo(t.lat, t.lng, t.z);
    if (!isSide()) { setSnap('peek'); }
    if (t.poi) { setTimeout(function () { var m = markerById[t.poi.id], e = m && m.getElement(); if (activeEl) { activeEl.classList.remove('is-active'); } activeEl = e; if (e) { e.classList.add('is-active'); } selected = t.poi; renderSun(); renderPeek(); }, 50); }
  });

  /* ---------------------------------------------------------------
   * Seasonal picks (evergreen, current season first)
   * ------------------------------------------------------------- */
  function renderSeasonal() {
    var ul = $('season-list'); ul.innerHTML = '';
    var order = ['winter', 'spring', 'summer', 'fall'], start = order.indexOf(season);
    var seq = order.slice(start).concat(order.slice(0, start));
    $('season-title').textContent = (SEASONAL.labels[season] || 'Seasonal') + ' ideas';
    var picks = SEASONAL.picks.filter(function (p) { return p.season === season; })
      .concat(SEASONAL.picks.filter(function (p) { return p.season === seq[1]; }).slice(0, 2));
    picks.forEach(function (p) {
      var li = el('li'), b = el('button'); b.type = 'button';
      var txt = el('span');
      txt.appendChild(el('span', 'item-title', p.title));
      txt.appendChild(el('span', 'item-sub', p.region + ' \u00b7 ' + p.line));
      b.appendChild(txt); b.appendChild(el('span', 'season-tag', SEASONAL.labels[p.season]));
      b.addEventListener('click', function () {
        flyTo(p.lat, p.lng, 8);
        showDetail({ kicker: SEASONAL.labels[p.season] + ' idea \u00b7 typical timing', title: p.title, line: p.line,
          facts: [['Region', p.region]], url: p.url });
      });
      li.appendChild(b); ul.appendChild(li);
    });
  }

  /* ---------------------------------------------------------------
   * Boot + refresh policy: on open, on return to tab, Refresh button,
   * and at most every 10 minutes while visible. No polling when hidden.
   * ------------------------------------------------------------- */
  LAYERS.forEach(function (d) {
    var st = S[d.id];
    chipFor(d);
    if (st.on) { st.group.addTo(map); if (d.onShow) { d.onShow(st); } }
    // Paint last-good data instantly for a fast first paint; live fetch follows.
    var cached = d.fetch && d.cache !== false && st.on ? store.get('c:' + d.id) : null;
    if (cached && cached.d) {
      try { st.data = cached.d; st.fetchedAt = cached.t; st.status = 'stale'; d.render(cached.d, st); } catch (e) { st.group.clearLayers(); st.data = null; st.status = 'idle'; }
    }
  });
  renderSeasonal();
  paintAll(); renderTonight(); renderSun();
  refreshAll();

  $('refresh').addEventListener('click', refreshAll);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && Date.now() - lastRefresh > 60000) { refreshAll(); }
  });
  setInterval(function () {
    if (document.hidden) { return; }
    if (Date.now() - lastRefresh >= AUTO_REFRESH_MS) { refreshAll(); } else { paintAll(); }
  }, 60000);
  if (sideMQ && sideMQ.addEventListener) { sideMQ.addEventListener('change', function () { setSnap('peek'); }); }
  window.addEventListener('online', function () { if (Date.now() - lastRefresh > 15000) { refreshAll(); } });
})();
