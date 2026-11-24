const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  tripName: String,
  visitedPlaces: [{ name: String, lat: Number, lon: Number, visitedAt: Date }],
  startDate: Date, endDate: Date,
  summary: String, notes: String, totalSpent: Number,
}, { timestamps: true });
module.exports = mongoose.model('TravelHistory', schema);
