const routing = require('../services/routingService');
const { asyncHandler, ok, fail } = require('../utils/helpers');
const { validCoords } = require('../utils/validators');
exports.calculate = asyncHandler(async (req, res) => {
  const { points, profile } = req.body;
  if (!Array.isArray(points) || points.length < 2 || points.length > 20 || !points.every((p) => validCoords(p.lat, p.lon)))
    return fail(res, 400, 'Provide 2–20 points with valid lat/lon');
  if (profile && !['driving-car', 'cycling-regular', 'foot-walking'].includes(profile)) return fail(res, 400, 'Invalid travel profile');
  ok(res, await routing.getRoute(points, profile || req.user.preferences?.defaultTravelMode));
});
