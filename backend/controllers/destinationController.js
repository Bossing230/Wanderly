const geocoding = require('../services/geocodingService');
const places = require('../services/placesService');
const User = require('../models/User');
const { asyncHandler, ok, fail } = require('../utils/helpers');
const { validCoords } = require('../utils/validators');
const images = require('../services/imageService');

exports.search = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) return fail(res, 400, 'Search query must be at least 2 characters');
  const results = await geocoding.search(q, { limit: +req.query.limit || 10, countrycodes: req.query.country });
  if (results[0]) {
    await User.updateOne({ _id: req.user._id }, { $push: { recentSearches: { $each: [{ query: q, lat: results[0].lat, lon: results[0].lon }], $slice: -20 } } });
  }
  ok(res, results);
});

exports.reverse = asyncHandler(async (req, res) => {
  if (!validCoords(req.query.lat, req.query.lon)) return fail(res, 400, 'Valid lat and lon are required');
  ok(res, await geocoding.reverse(req.query.lat, req.query.lon));
});

exports.nearby = asyncHandler(async (req, res) => {
  const { lat, lon, category, radius, limit } = req.query;
  if (!validCoords(lat, lon)) return fail(res, 400, 'Valid lat and lon are required');
  ok(res, await places.nearby(+lat, +lon, { category, radius: +radius || 10000, limit: +limit || 20 }));
});

exports.categories = (_req, res) => ok(res, places.categories);

exports.recent = asyncHandler(async (req, res) => ok(res, [...req.user.recentSearches].reverse().slice(0, 10)));

exports.image = asyncHandler(async (req, res) => {
  const { name, lat, lon, hint, cat, country } = req.query;
  if (!name || !validCoords(lat, lon)) return fail(res, 400, 'name, lat and lon are required');
  ok(res, await images.findImage(String(name), +lat, +lon, hint, cat, country));
});