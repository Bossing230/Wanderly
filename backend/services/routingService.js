const axios = require('axios');

// ORS moved from api.openrouteservice.org to api.heigit.org (override with ORS_BASE_URL if needed).
const BASE = process.env.ORS_BASE_URL || 'https://api.heigit.org/openrouteservice';

exports.getRoute = async (points, profile = 'driving-car') => {
  if (!process.env.ORS_KEY) {
    const e = new Error('ORS_KEY is not configured'); e.status = 503; throw e;
  }
  const { data } = await axios.post(
    `${BASE}/v2/directions/${profile}/geojson`,
    { coordinates: points.map((p) => [+p.lon, +p.lat]) },
    { timeout: 15000, headers: { Authorization: process.env.ORS_KEY, 'Content-Type': 'application/json' } }
  );
  const f = data.features[0];
  return {
    profile,
    distanceKm: +(f.properties.summary.distance / 1000).toFixed(1),
    durationMin: Math.round(f.properties.summary.duration / 60),
    path: f.geometry.coordinates.map(([lon, lat]) => [lat, lon]), // Leaflet order
    segments: (f.properties.segments || []).map((s) => ({
      distanceKm: +(s.distance / 1000).toFixed(1),
      durationMin: Math.round(s.duration / 60),
    })),
  };
};