const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
  title: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  order: { type: Number, default: 0 },
  place: { name: String, lat: Number, lon: Number, category: String, address: String },
  notes: String,
  visited: { type: Boolean, default: false },
}, { timestamps: true });
module.exports = mongoose.model('Itinerary', schema);
