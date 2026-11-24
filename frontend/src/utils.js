export const CATS = ['all', 'city', 'beach', 'museum', 'park', 'historic', 'nature'];
const KEYS = {
  city: ['city', 'town', 'village', 'municipality', 'administrative', 'suburb', 'county', 'state'],
  beach: ['beach'], museum: ['museum', 'gallery'], park: ['park', 'garden', 'nature_reserve'],
  historic: ['monument', 'memorial', 'castle', 'ruins', 'archaeological', 'historic', 'heritage', 'church'],
  nature: ['waterfall', 'peak', 'volcano', 'forest', 'natural', 'bay', 'cape', 'island'],
};
export const matchesCategory = (d, cat) => cat === 'all' || (KEYS[cat] || []).some((k) => (d.category || '').includes(k));
export const prettyCat = (c = '') => (c.split('.').pop() || 'place').replace(/_/g, ' ');
export const addrText = (d) => (typeof d.address === 'string' ? d.address : d.displayName || '');
export const destId = (d) => d.externalId || `coord-${(+d.lat).toFixed(4)}-${(+d.lon).toFixed(4)}`;
export const destUrl = (d) => `/destination?${new URLSearchParams({ id: destId(d), name: d.name, lat: d.lat, lon: d.lon, cat: d.category || '', addr: addrText(d) })}`;
export const parseDest = (sp) => ({ externalId: sp.get('id'), name: sp.get('name'), lat: +sp.get('lat'), lon: +sp.get('lon'), category: sp.get('cat') || '', displayName: sp.get('addr') || '' });
export const toPlace = (d) => ({ name: d.name, lat: d.lat, lon: d.lon, category: d.category, address: addrText(d) });
export const tileUrl = (lat, lon, z = 11) => {
  const n = 2 ** z, r = (lat * Math.PI) / 180;
  const x = Math.floor(((lon + 180) / 360) * n);
  const y = Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n);
  return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
};
export const fmtDist = (km, u) => (u === 'imperial' ? `${(km * 0.621371).toFixed(1)} mi` : `${km} km`);
export const fmtTemp = (c, u) => (u === 'imperial' ? `${Math.round((c * 9) / 5 + 32)}°F` : `${Math.round(c)}°C`);
export const fmtDur = (m) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`);
export const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
export const toInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
