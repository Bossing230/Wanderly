const axios = require('axios');
const { sleep, toLatin } = require('../utils/helpers');

const http = axios.create({
  baseURL: 'https://nominatim.openstreetmap.org',
  timeout: 20000,
  headers: { 'User-Agent': process.env.NOMINATIM_USER_AGENT || 'Wanderly/1.0' },
});

// Nominatim allows 1 request per second: queue requests and cache repeats for 5 minutes.
let queue = Promise.resolve();
let lastAt = 0;
const throttled = (fn) => {
  const run = queue.then(async () => {
    const wait = Math.max(0, lastAt + 1100 - Date.now());
    if (wait) await sleep(wait);
    lastAt = Date.now();
    return fn();
  });
  queue = run.catch(() => {});
  return run;
};
const cache = new Map();
const cached = async (key, fn) => {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < 5 * 60 * 1000) return hit.v;
  const v = await throttled(fn);
  cache.set(key, { v, t: Date.now() });
  return v;
};

// English name when OpenStreetMap has one, otherwise the local name written in Latin letters.
const normalize = (r) => {
  const local = r.name || r.display_name.split(',')[0];
  const name = toLatin(local);
  return {
    externalId: `osm-${r.osm_type}-${r.osm_id}`,
    name,
    localName: name !== local ? local : undefined, // original spelling, shown small on the card
    displayName: toLatin(r.display_name),
    category: r.type || r.class,
    lat: +r.lat, lon: +r.lon,
    address: r.address || {},
    boundingBox: r.boundingbox?.map(Number),
  };
};

exports.search = (q, { limit = 10, countrycodes } = {}) =>
  cached(`s:${q.toLowerCase()}:${limit}:${countrycodes || ''}`, async () => {
    const { data } = await http.get('/search', { params: { q, format: 'jsonv2', addressdetails: 1, limit, countrycodes, 'accept-language': 'en' } });
    return data.map(normalize);
  });

exports.reverse = (lat, lon) =>
  cached(`r:${(+lat).toFixed(4)}:${(+lon).toFixed(4)}`, async () => {
    const { data } = await http.get('/reverse', { params: { lat, lon, format: 'jsonv2', addressdetails: 1, 'accept-language': 'en' } });
    return data.error ? null : normalize(data);
  });