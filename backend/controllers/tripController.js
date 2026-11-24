const Trip = require('../models/Trip');
const Itinerary = require('../models/Itinerary');
const Favorite = require('../models/Favorite');
const TravelHistory = require('../models/TravelHistory');
const { asyncHandler, ok, fail } = require('../utils/helpers');

const pick = (b) => ({ name: b.name, description: b.description, destinations: b.destinations, startDate: b.startDate, endDate: b.endDate, budget: b.budget, status: b.status, notes: b.notes });
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

// Keep travel history consistent with completed trips.
async function syncHistory(trip) {
  if (trip.status !== 'completed') return TravelHistory.deleteOne({ trip: trip._id });
  const visited = await Itinerary.find({ trip: trip._id, visited: true });
  await TravelHistory.findOneAndUpdate({ trip: trip._id }, {
    user: trip.user, trip: trip._id, tripName: trip.name, startDate: trip.startDate, endDate: trip.endDate, notes: trip.notes,
    totalSpent: trip.budget, summary: `${visited.length} places visited across ${trip.destinations.length} destination(s).`,
    visitedPlaces: visited.filter((v) => v.place?.name).map((v) => ({ name: v.place.name, lat: v.place.lat, lon: v.place.lon, visitedAt: v.date })),
  }, { upsert: true, new: true });
}

exports.list = asyncHandler(async (req, res) => {
  const f = { user: req.user._id };
  if (req.query.status) f.status = req.query.status;
  if (req.query.upcoming === 'true') { f.startDate = { $gte: new Date() }; f.status = 'planned'; }
  ok(res, await Trip.find(f).sort('startDate'));
});

exports.get = asyncHandler(async (req, res) => {
  const t = await Trip.findOne({ _id: req.params.id, user: req.user._id });
  t ? ok(res, t) : fail(res, 404, 'Trip not found');
});

exports.create = asyncHandler(async (req, res) => {
  const b = req.body;
  if (!b.name || !b.startDate || !b.endDate) return fail(res, 400, 'Name, start date and end date are required');
  ok(res, await Trip.create({ ...clean(pick(b)), user: req.user._id }), 201);
});

exports.update = asyncHandler(async (req, res) => {
  const t = await Trip.findOne({ _id: req.params.id, user: req.user._id });
  if (!t) return fail(res, 404, 'Trip not found');
  t.set(clean(pick(req.body)));
  await t.save();
  await syncHistory(t);
  ok(res, t);
});

exports.remove = asyncHandler(async (req, res) => {
  const t = await Trip.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!t) return fail(res, 404, 'Trip not found');
  await Promise.all([Itinerary.deleteMany({ trip: t._id }), TravelHistory.deleteMany({ trip: t._id })]);
  ok(res, { id: t._id });
});

exports.addDestination = asyncHandler(async (req, res) => {
  const t = await Trip.findOne({ _id: req.params.id, user: req.user._id });
  if (!t) return fail(res, 404, 'Trip not found');
  const { name, lat, lon, category, address } = req.body;
  if (!name || lat == null || lon == null) return fail(res, 400, 'name, lat and lon required');
  t.destinations.push({ name, lat, lon, category, address });
  await t.save();
  ok(res, t);
});

exports.history = asyncHandler(async (req, res) => {
  // All itinerary items for this user, grouped by trip
  const all = await Itinerary.find({ user: req.user._id }).sort('date time order');
  const byTrip = {};
  all.forEach((v) => { (byTrip[String(v.trip)] = byTrip[String(v.trip)] || []).push(v); });
  const withTicks = Object.keys(byTrip).filter((k) => byTrip[k].some((v) => v.visited));

  // Completed trips, cancelled trips, and any trip with at least one ticked activity
  const f = {
    user: req.user._id,
    $or: [{ status: 'completed' }, { status: 'cancelled' }, { _id: { $in: withTicks } }],
  };
  if (req.query.q) f.name = new RegExp(req.query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const trips = await Trip.find(f).sort('-endDate');

  const items = trips.map((t) => {
    const list = byTrip[String(t._id)] || [];
    const visited = list.filter((v) => v.visited);
    const cancelled = t.status === 'cancelled';
    const nameOf = (v) => v.place?.name || v.title;
    return {
      _id: t._id,
      trip: t._id,
      tripName: t.name,
      status: t.status,
      startDate: t.startDate,
      endDate: t.endDate,
      notes: t.notes,
      totalSpent: t.budget,
      visitedPlaces: visited.map((v) => ({ name: nameOf(v), lat: v.place?.lat, lon: v.place?.lon, visitedAt: v.date })),
      plannedStops: list.map((v) => ({ name: nameOf(v), date: v.date, visited: v.visited })),
      summary: cancelled
        ? `Cancelled. ${list.length} stop(s) were planned.`
        : `${visited.length} place(s) visited${t.status === 'completed' ? '' : ' so far'}.`,
    };
  });

  const places = new Set(items.flatMap((h) => h.visitedPlaces.map((p) => p.name)));
  const completed = items.filter((h) => h.status === 'completed');
  ok(res, {
    items,
    stats: {
      trips: completed.length,
      placesVisited: places.size,
      totalSpent: completed.reduce((s, h) => s + (h.totalSpent || 0), 0),
    },
  });
});

exports.stats = asyncHandler(async (req, res) => {
  const u = req.user._id;
  const [trips, favorites, recent, plannedStops] = await Promise.all([
    Trip.find({ user: u }),
    Favorite.find({ user: u }),
    Promise.resolve(req.user.recentSearches),
    Itinerary.countDocuments({ user: u }), // every planned stop, including those of cancelled trips
  ]);
  const now = new Date();
  const byCat = {}; favorites.forEach((f) => { byCat[f.category] = (byCat[f.category] || 0) + 1; });
  const byMonth = {}; trips.forEach((t) => { const k = t.startDate.toISOString().slice(0, 7); byMonth[k] = (byMonth[k] || 0) + 1; });
  ok(res, {
    savedDestinations: favorites.length, favorites: favorites.length,
    upcomingTrips: trips.filter((t) => t.status === 'planned' && t.startDate >= now).length,
    completedTrips: trips.filter((t) => t.status === 'completed').length,
    plannedDestinations: plannedStops,
    categoryBreakdown: Object.entries(byCat).map(([name, value]) => ({ name, value })),
    tripsByMonth: Object.entries(byMonth).sort().map(([month, count]) => ({ month, count })),
    recentlyExplored: [...recent].reverse().slice(0, 6),
  });
});