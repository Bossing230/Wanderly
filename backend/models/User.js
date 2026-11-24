const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8 },
  preferences: {
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    units: { type: String, enum: ['metric', 'imperial'], default: 'metric' },
    currency: { type: String, default: 'USD' },
    defaultTravelMode: { type: String, enum: ['driving-car', 'cycling-regular', 'foot-walking'], default: 'driving-car' },
    defaultBudget: { type: Number, default: 0 },
  },
  recentSearches: [{ query: String, lat: Number, lon: Number, at: { type: Date, default: Date.now } }],
}, { timestamps: true });
schema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
schema.methods.matches = function (plain) { return bcrypt.compare(plain, this.password); };
module.exports = mongoose.model('User', schema);
