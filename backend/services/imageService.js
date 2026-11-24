const axios = require('axios');

const headers = { 'User-Agent': process.env.NOMINATIM_USER_AGENT || 'Wanderly/1.0' };
const T = 7000; // each request gives up after 7 seconds
const wiki = axios.create({ baseURL: 'https://en.wikipedia.org/w/api.php', timeout: T, headers });
const commons = axios.create({ baseURL: 'https://commons.wikimedia.org/w/api.php', timeout: T, headers });
const openverse = axios.create({ baseURL: 'https://api.openverse.org/v1', timeout: T, headers });
const mapillary = axios.create({ baseURL: 'https://graph.mapillary.com', timeout: T });

const STOP = new Set(['park', 'city', 'church', 'beach', 'museum', 'the', 'of', 'de', 'del', 'saint', 'san', 'santa', 'municipality', 'barangay', 'province', 'resort', 'hotel', 'house', 'plaza', 'public', 'national', 'old', 'new', 'theater', 'theatre', 'woods']);
const BAD = /logo|map|flag|seal|coat|icon|diagram|signature|locator|banner|stamp|poster|\.svg/i;

const tokens = (s = '') => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z0-9]+/).filter((t) => t.length >= 3 && !STOP.has(t));
const similar = (a, b) => a.some((x) => b.some((y) => x.includes(y) || y.includes(x)));
const allIn = (a, b) => a.length > 0 && a.every((x) => b.some((y) => x.includes(y) || y.includes(x)));
const hash = (s = '') => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const km = (lat1, lon1, lat2, lon2) => {
  const r = (d) => (d * Math.PI) / 180;
  const a = Math.sin(r(lat2 - lat1) / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lon2 - lon1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
};

// Real photos of the place -------------------------------------------------

async function wikipediaPhoto(query, name, lat, lon) {
  const { data } = await wiki.get('', {
    params: { action: 'query', format: 'json', generator: 'search', gsrsearch: query, gsrlimit: 5, prop: 'pageimages|coordinates', piprop: 'thumbnail', pithumbsize: 640, pilimit: 5, colimit: 5, redirects: 1 },
  });
  const want = tokens(name);
  if (!want.length) return null;
  const pages = Object.values(data?.query?.pages || {}).sort((a, b) => a.index - b.index);
  for (const p of pages) {
    const src = p.thumbnail?.source;
    if (!src || BAD.test(src) || BAD.test(p.pageimage || '')) continue;
    const got = tokens(p.title);
    const c = p.coordinates?.[0];
    if (c) { if (!similar(want, got) || km(lat, lon, c.lat, c.lon) > 25) continue; }
    else if (!allIn(want, got)) continue;
    return { url: src, title: p.title, link: `https://en.wikipedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}`, credit: 'Photo: Wikipedia' };
  }
  return null;
}

async function commonsPhoto(name, lat, lon, radius, needNameMatch) {
  const g = await commons.get('', { params: { action: 'query', format: 'json', list: 'geosearch', gscoord: `${lat}|${lon}`, gsradius: radius, gslimit: 20, gsnamespace: 6 } });
  const hits = (g.data?.query?.geosearch || []).filter((h) => /\.(jpe?g|png)$/i.test(h.title) && !BAD.test(h.title));
  const want = tokens(name);
  let ranked = hits.map((h) => ({ ...h, match: similar(want, tokens(h.title)) }));
  if (needNameMatch) ranked = ranked.filter((h) => h.match);
  ranked = ranked.sort((a, b) => Number(b.match) - Number(a.match) || a.dist - b.dist).slice(0, 6);
  if (!ranked.length) return null;
  const info = await commons.get('', { params: { action: 'query', format: 'json', prop: 'imageinfo', iiprop: 'url|size', iiurlwidth: 640, titles: ranked.map((r) => r.title).join('|') } });
  const byTitle = new Map(Object.values(info.data?.query?.pages || {}).map((p) => [p.title, p]));
  for (const r of ranked) {
    const ii = byTitle.get(r.title)?.imageinfo?.[0];
    if (!ii?.thumburl || ii.width < 500 || ii.height > ii.width * 1.6) continue;
    return { url: ii.thumburl, title: r.title, link: `https://commons.wikimedia.org/wiki/${encodeURIComponent(r.title.replace(/ /g, '_'))}`, credit: 'Photo: Wikimedia Commons' };
  }
  return null;
}

async function openversePhoto(name, hint) {
  const want = tokens(name);
  if (!want.length) return null;
  const hintTok = tokens(hint || '');
  const { data } = await openverse.get('/images/', { params: { q: hint ? `${name} ${hint}` : name, category: 'photograph', page_size: 12, mature: false } });
  for (const r of data?.results || []) {
    const text = tokens(`${r.title || ''} ${(r.tags || []).map((t) => t.name).join(' ')}`);
    if (!allIn(want, text)) continue;
    if (hintTok.length && !similar(hintTok, text)) continue;
    const img = r.thumbnail || r.url; // the browser falls back to the cover if an image fails to load
    if (!img) continue;
    return { url: img, title: r.title, link: r.foreign_landing_url || r.url, credit: `Photo: ${r.creator || r.source || 'Openverse'}` };
  }
  return null;
}

async function mapillaryPhoto(lat, lon, radiusM) {
  const token = process.env.MAPILLARY_TOKEN;
  if (!token) return null;
  const d = radiusM / 111320;
  const dLon = d / Math.cos((lat * Math.PI) / 180);
  const { data } = await mapillary.get('/images', {
    params: { access_token: token, fields: 'id,thumb_1024_url,geometry,is_pano', bbox: `${lon - dLon},${lat - d},${lon + dLon},${lat + d}`, limit: 40 },
  });
  const best = (data?.data || [])
    .filter((i) => i.thumb_1024_url && !i.is_pano && i.geometry?.coordinates)
    .map((i) => ({ ...i, dist: km(lat, lon, i.geometry.coordinates[1], i.geometry.coordinates[0]) }))
    .sort((a, b) => a.dist - b.dist)[0];
  if (!best) return null;
  return { url: best.thumb_1024_url, title: 'Street-level view', link: `https://www.mapillary.com/app/?pKey=${best.id}`, credit: 'Street view: Mapillary' };
}

// Last resort: a photo of the same TYPE of place in the same country, from Wikimedia Commons (no key needed).
// It is labelled "Illustrative" because it is not a photo of this exact place.
const TERMS = [
  [/beach|bay|coast|island|water/, 'tropical beach'], [/park|garden|leisure|forest|nature|natural/, 'park'],
  [/museum|gallery/, 'museum'], [/church|chapel|cathedral/, 'church'],
  [/monument|memorial|castle|historic|heritage|building|house/, 'historic building'],
  [/peak|mountain|volcano|waterfall|viewpoint/, 'mountain landscape'], [/city|town|village|municipality|suburb|administrative/, 'city'],
];
async function stockPhoto(name, country, cat) {
  const term = (TERMS.find(([re]) => re.test(cat || '')) || [null, 'travel landmark'])[1];
  const place = /^[A-Za-z .'-]{3,40}$/.test(country || '') ? country.trim() : '';
  for (const q of [place ? `${term} ${place}` : null, term].filter(Boolean)) {
    const { data } = await commons.get('', {
      params: { action: 'query', format: 'json', generator: 'search', gsrsearch: `${q} filetype:bitmap`, gsrnamespace: 6, gsrlimit: 25, prop: 'imageinfo', iiprop: 'url|size', iiurlwidth: 640 },
    });
    const list = Object.values(data?.query?.pages || {})
      .sort((x, y) => x.index - y.index)
      .filter((p) => {
        const ii = p.imageinfo?.[0];
        return ii?.thumburl && /\.jpe?g$/i.test(p.title) && !BAD.test(p.title) && ii.width >= 800 && ii.width / ii.height >= 1.2 && ii.width / ii.height <= 2;
      });
    if (list.length) {
      const p = list[hash(name) % list.length]; // different places get different photos
      return { url: p.imageinfo[0].thumburl, title: p.title, link: `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}`, credit: 'Illustrative · Wikimedia Commons', illustrative: true };
    }
  }
  return null;
}

// Controls ----------------------------------------------------------------

let active = 0;
const waiting = [];
const acquire = () => new Promise((res) => { if (active < 3) { active += 1; res(); } else waiting.push(res); }); // max 3 lookups at once
const release = () => { const next = waiting.shift(); if (next) next(); else active -= 1; };

const run = async (label, fn, state) => {
  try { return await fn(); } catch (e) { state.failed = true; console.error(`[image:${label}] ${e.message}`); return null; }
};
const firstOf = async (jobs) => (await Promise.all(jobs)).find(Boolean) || null; // sources run in parallel, best one wins

const cache = new Map();
const ttl = (e) => (e.short ? 5 * 60 * 1000 : e.v?.credit?.includes('Mapillary') ? 30 * 60 * 1000 : 24 * 60 * 60 * 1000);

exports.findImage = async (name, lat, lon, hint, cat, country) => {
  const key = `${name.toLowerCase()}|${lat.toFixed(3)}|${lon.toFixed(3)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < ttl(hit)) return hit.v;

  await acquire();
  try {
    const st = { failed: false };
    let r = await firstOf([
      run('wikipedia', () => wikipediaPhoto(name, name, lat, lon), st),
      run('commons-near', () => commonsPhoto(name, lat, lon, 250, false), st),
      run('openverse', () => openversePhoto(name, hint), st),
    ]);
    if (!r) {
      r = await firstOf([
        run('commons-wide', () => commonsPhoto(name, lat, lon, 2000, true), st),
        run('mapillary', async () => (await mapillaryPhoto(lat, lon, 60)) || (await mapillaryPhoto(lat, lon, 200)), st),
        run('wikipedia-hint', () => (hint ? wikipediaPhoto(`${name} ${hint}`, name, lat, lon) : null), st),
      ]);
    }
    if (!r) r = await run('stock', () => stockPhoto(name, country, cat), st);
    // Nothing found AND some sources failed (e.g. network trouble): do not remember this, try again next time.
    if (!r && st.failed) return { unavailable: true };
    cache.set(key, { v: r, t: Date.now(), short: st.failed });
    return r;
  } finally { release(); }
};