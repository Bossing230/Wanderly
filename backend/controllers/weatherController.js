const weather = require('../services/weatherService');
const { asyncHandler, ok, fail } = require('../utils/helpers');
const { validCoords } = require('../utils/validators');
exports.forecast = asyncHandler(async (req, res) => {
  const { lat, lon, days } = req.query;
  if (!validCoords(lat, lon)) return fail(res, 400, 'Valid lat and lon are required');
  ok(res, await weather.forecast(+lat, +lon, Math.min(+days || 7, 16)));
});
