const mongoose = require('mongoose');
const stop = new mongoose.Schema({ name: String, lat: Number, lon: Number, category: String, address: String }, { _id: true });
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: String,
  destinations: [stop],
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true, validate: { validator() { return this.endDate >= this.startDate; }, message: 'End date must be on or after start date' } },
  budget: { type: Number, min: 0, default: 0 },
  status: { type: String, enum: ['planned', 'ongoing', 'completed', 'cancelled'], default: 'planned' },
  notes: String,
}, { timestamps: true });
module.exports = mongoose.model('Trip', schema);
