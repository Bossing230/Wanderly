const mongoose = require('mongoose');
// Snapshot keeps saved data intact even if the external API changes.
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  externalId: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, default: 'general' },
  address: String,
  lat: { type: Number, required: true, min: -90, max: 90 },
  lon: { type: Number, required: true, min: -180, max: 180 },
  collectionName: { type: String, default: 'Default' },
  notes: String,
}, { timestamps: true });
schema.index({ user: 1, externalId: 1 }, { unique: true });
module.exports = mongoose.model('Favorite', schema);
