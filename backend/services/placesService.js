const axios = require('axios');
const { toLatin } = require('../utils/helpers');

const CATEGORIES = {
  all: 'tourism.attraction,tourism.sights,beach,natural,entertainment.museum,leisure.park',
  beach: 'beach', museum: 'entertainment.museum', park: 'leisure.park',
  nature: 'natural', historic: 'tourism.sights.monuments,heritage', viewpoint: 'tourism.attraction.viewpoint',
};
exports.categories = Object.keys(CATEGORIES);

exports.nearby = async (lat, lon, { category = 'all', radius = 10000, limit = 20 } = {}) => {
  if (!process.env.GEOAPIFY_KEY) { const e = new Error('GEOAPIFY_KEY is not configured'); e.status = 503; throw e; }
  const { data } = await axios.get('https://api.geoapify.com/v2/places', {
    timeout: 20000,
    params: { categories: CATEGORIES[category] || CATEGORIES.all, filter: `circle:${lon},${lat},${radius}`, bias: `proximity:${lon},${lat}`, limit, lang: 'en', apiKey: process.env.GEOAPIFY_KEY },
  });
  return data.features.filter((f) => f.properties.name).map((f) => {
    const p = f.properties;
    const local = p.name;
    const name = toLatin(p.name_international?.en || local); // English name when it exists, otherwise romanized
    return {
      externalId: `geo-${p.place_id}`,
      name,
      localName: name !== local ? local : undefined, // original spelling, shown small on the card
      category: (p.categories || [])[0] || 'attraction',
      categories: p.categories || [],
      address: toLatin(p.formatted),
      lat: p.lat, lon: p.lon,
      distance: p.distance,
    };
  });
};