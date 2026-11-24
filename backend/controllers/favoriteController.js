const Favorite = require('../models/Favorite');
const { asyncHandler, ok, fail } = require('../utils/helpers');
const { validCoords } = require('../utils/validators');

exports.list = asyncHandler(async (req, res) => {
  const { q, category, collection } = req.query;
  const f = { user: req.user._id };
  if (category) f.category = category;
  if (collection) f.collectionName = collection;
  if (q) f.name = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  ok(res, await Favorite.find(f).sort('-createdAt'));
});

exports.add = asyncHandler(async (req, res) => {
  const { externalId, name, category, address, lat, lon, collectionName, notes } = req.body;
  if (!externalId || !name || !validCoords(lat, lon)) return fail(res, 400, 'externalId, name and valid coordinates are required');
  const exists = await Favorite.findOne({ user: req.user._id, externalId });
  if (exists) return fail(res, 409, 'Already in favorites');
  ok(res, await Favorite.create({ user: req.user._id, externalId, name, category, address, lat, lon, collectionName, notes }), 201);
});

exports.update = asyncHandler(async (req, res) => {
  const { collectionName, notes } = req.body;
  const fav = await Favorite.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { collectionName, notes }, { new: true, runValidators: true });
  fav ? ok(res, fav) : fail(res, 404, 'Favorite not found');
});

exports.remove = asyncHandler(async (req, res) => {
  const d = await Favorite.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  d ? ok(res, { id: d._id }) : fail(res, 404, 'Favorite not found');
});
