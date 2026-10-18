/* Evergreen seasonal picks and season tints. No dates, no years: "typically" only. */
window.MI_SEASONAL = {
  /* Month index (0-11) -> season key. */
  seasonOf: function (month) {
    if (month === 11 || month <= 1) { return 'winter'; }
    if (month <= 4) { return 'spring'; }
    if (month <= 7) { return 'summer'; }
    return 'fall';
  },
  labels: { winter: 'Winter', spring: 'Spring', summer: 'Summer', fall: 'Fall' },

  picks: [
    { season: 'fall', region: 'Northwest', title: 'Color drive on M-22',
      line: 'The Leelanau shoreline loop typically colors up in early to mid October.',
      lat: 44.95, lng: -85.95, url: 'https://www.traversecity.com/' },
    { season: 'fall', region: 'Upper Peninsula', title: 'Brockway Mountain Drive',
      line: 'High ridge road above Copper Harbor; U.P. color typically peaks late September to early October.',
      lat: 47.465, lng: -87.95, url: 'https://www.keweenaw.info/' },
    { season: 'fall', region: 'Upper Peninsula', title: 'Lake of the Clouds overlook',
      line: 'A classic color view in the Porcupine Mountains, typically best around early October.',
      lat: 46.80, lng: -89.77, url: 'https://www.michigan.gov/recsearch/parks/porcupinemountains' },
    { season: 'fall', region: 'Northern Lower', title: 'Tunnel of Trees (M-119)',
      line: 'Narrow, canopied shoreline road north of Harbor Springs, typically vivid in mid October.',
      lat: 45.53, lng: -85.0, url: 'https://www.michigan.org/' },
    { season: 'fall', region: 'Southeast', title: 'Cider mills',
      line: 'Southern Michigan orchards typically run cider and donuts through the fall.',
      lat: 42.65, lng: -83.3, url: 'https://www.michigan.org/' },

    { season: 'winter', region: 'Upper Peninsula', title: 'Tahquamenon Falls, frozen',
      line: 'The Upper Falls typically ice over in deep winter; snowshoe trails link the overlooks.',
      lat: 46.575, lng: -85.2575, url: 'https://www.michigan.gov/recsearch/parks/tahquamenonfalls' },
    { season: 'winter', region: 'Upper Peninsula', title: 'Ice caves near Munising',
      line: 'Frozen seeps along the Pictured Rocks shore typically form in the coldest weeks; check NPS conditions.',
      lat: 46.43, lng: -86.65, url: 'https://www.nps.gov/piro/' },
    { season: 'winter', region: 'Upper Peninsula', title: 'Porkies downhill and backcountry',
      line: 'Lake-effect snow typically makes the western U.P. the snowiest corner of the state.',
      lat: 46.76, lng: -89.79, url: 'https://www.michigan.gov/recsearch/parks/porcupinemountains' },
    { season: 'winter', region: 'Northwest', title: 'Cross-country at Sleeping Bear',
      line: 'Marked ski trails through dune forest, typically skiable when snow cover holds.',
      lat: 44.88, lng: -86.04, url: 'https://www.nps.gov/slbe/' },

    { season: 'spring', region: 'West Michigan', title: 'Tulips in Holland',
      line: 'Holland\u2019s tulip lanes typically bloom in May.',
      lat: 42.7875, lng: -86.1089, url: 'https://www.holland.org/' },
    { season: 'spring', region: 'Upper Peninsula', title: 'Waterfall season',
      line: 'Snowmelt typically makes U.P. falls their loudest in spring.',
      lat: 46.50, lng: -86.0, url: 'https://www.michigan.org/' },
    { season: 'spring', region: 'Northern Lower', title: 'Morel hunting',
      line: 'Morels typically pop in northern Lower Michigan woods in spring; know your mushrooms.',
      lat: 44.6, lng: -84.7, url: 'https://www.michigan.gov/dnr' },
    { season: 'spring', region: 'Northwest', title: 'Cherry blossoms on Old Mission',
      line: 'Orchards on the Old Mission Peninsula typically blossom in mid to late spring.',
      lat: 44.90, lng: -85.50, url: 'https://www.traversecity.com/' },

    { season: 'summer', region: 'Upper Peninsula', title: 'Pictured Rocks paddle',
      line: 'Calm-water mornings are typically best for kayaking under the cliffs; go with a guide if new.',
      lat: 46.4925, lng: -86.545, url: 'https://www.nps.gov/piro/' },
    { season: 'summer', region: 'Straits', title: 'Bike around Mackinac Island',
      line: 'The 8-mile M-185 shoreline loop is car-free and typically busiest in midsummer.',
      lat: 45.8492, lng: -84.6189, url: 'https://www.mackinacisland.org/' },
    { season: 'summer', region: 'Northwest', title: 'Dune Climb at Sleeping Bear',
      line: 'Go early or late in the day; sand typically gets hot by afternoon.',
      lat: 44.8822, lng: -86.0417, url: 'https://www.nps.gov/slbe/' },
    { season: 'summer', region: 'Lake Superior', title: 'Isle Royale backcountry',
      line: 'The ferry and seaplane season is typically late spring to early fall.',
      lat: 48.0, lng: -88.9, url: 'https://www.nps.gov/isro/' },
    { season: 'summer', region: 'Upper Peninsula', title: 'Freighters at the Soo Locks',
      line: 'Ships typically pass day and night through the shipping season.',
      lat: 46.5034, lng: -84.3503, url: 'https://www.saultstemarie.com/' }
  ],

  /* Region tints for the "Season" layer. Rough boxes [south, west, north, east]. */
  tints: {
    fall: [
      { name: 'Upper Peninsula', box: [45.6, -90.4, 47.5, -84.4], months: [8, 9],
        tip: 'U.P. color typically peaks late September to early October.' },
      { name: 'Northern Lower', box: [44.0, -86.4, 45.8, -83.3], months: [9],
        tip: 'Northern Lower Michigan typically peaks in early to mid October.' },
      { name: 'Southern Lower', box: [41.7, -86.6, 44.0, -82.5], months: [9, 10],
        tip: 'Southern Michigan typically peaks mid to late October.' }
    ],
    winter: [
      { name: 'Western U.P. snow belt', box: [46.2, -90.4, 47.5, -87.8], months: [11, 0, 1],
        tip: 'Lake-effect snow typically piles up most here.' },
      { name: 'West Michigan snow belt', box: [42.2, -86.5, 44.3, -85.6], months: [11, 0, 1],
        tip: 'Lake Michigan typically feeds lake-effect bands along this shore.' }
    ],
    spring: [
      { name: 'Upper Peninsula falls', box: [45.9, -90.0, 47.3, -84.7], months: [3, 4],
        tip: 'Snowmelt typically peaks waterfall flow here in spring.' },
      { name: 'West Michigan blossoms', box: [42.0, -86.6, 45.1, -85.3], months: [4],
        tip: 'Orchards and tulips typically bloom here in May.' }
    ],
    summer: [
      { name: 'Lake Superior shore', box: [46.3, -88.0, 46.9, -84.9], months: [5, 6, 7],
        tip: 'Calm summer mornings are typically best for paddling.' },
      { name: 'Lake Michigan dunes', box: [42.0, -86.6, 45.2, -85.6], months: [5, 6, 7],
        tip: 'Beach season typically runs through summer along the dunes.' }
    ]
  }
};
