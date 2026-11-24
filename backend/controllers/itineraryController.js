const Itinerary = require('../models/Itinerary');
const Trip = require('../models/Trip');
const TravelHistory = require('../models/TravelHistory');
const { asyncHandler, ok, fail } = require('../utils/helpers');

async function ownTrip(req, tripId) { return Trip.findOne({ _id: tripId, user: req.user._id }); }
const inRange = (trip, d) => { const x = new Date(d); return x >= new Date(new Date(trip.startDate).setHours(0, 0, 0, 0)) && x <= new Date(new Date(trip.endDate).setHours(23, 59, 59, 999)); };

exports.list = asyncHandler(async (req, res) => {
  if (!req.query.trip) return fail(res, 400, 'trip query parameter is required');
  if (!(await ownTrip(req, req.query.trip))) return fail(res, 404, 'Trip not found');
  ok(res, await Itinerary.find({ trip: req.query.trip, user: req.user._id }).sort('date time order'));
});

exports.create = asyncHandler(async (req, res) => {
  const { trip: tripId, title, date, time, place, notes, order } = req.body;
  const trip = await ownTrip(req, tripId);
  if (!trip) return fail(res, 404, 'Trip not found');
  if (!title || !date) return fail(res, 400, 'Title and date are required');
  if (!inRange(trip, date)) return fail(res, 400, 'Date must fall within the trip dates');
  ok(res, await Itinerary.create({ user: req.user._id, trip: tripId, title, date, time, place, notes, order }), 201);
});

exports.update = asyncHandler(async (req, res) => {
  const item = await Itinerary.findOne({ _id: req.params.id, user: req.user._id });
  if (!item) return fail(res, 404, 'Itinerary item not found');
  const trip = await ownTrip(req, item.trip);
  if (req.body.date && !inRange(trip, req.body.date)) return fail(res, 400, 'Date must fall within the trip dates');
  ['title', 'date', 'time', 'place', 'notes', 'order', 'visited'].forEach((k) => { if (req.body[k] !== undefined) item[k] = req.body[k]; });
  await item.save();
  if (trip.status === 'completed') { // refresh history snapshot
    const visited = await Itinerary.find({ trip: trip._id, visited: true });
    await TravelHistory.updateOne({ trip: trip._id }, { visitedPlaces: visited.filter((v) => v.place?.name).map((v) => ({ name: v.place.name, lat: v.place.lat, lon: v.place.lon, visitedAt: v.date })) });
  }
  ok(res, item);
});

exports.remove = asyncHandler(async (req, res) => {
  const d = await Itinerary.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  d ? ok(res, { id: d._id }) : fail(res, 404, 'Itinerary item not found');
});
