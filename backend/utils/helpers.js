exports.asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
exports.ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
exports.fail = (res, status, message) => res.status(status).json({ success: false, message });
exports.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Show place names in Latin letters: Chinese, Cyrillic, Arabic, Thai... are romanized.
// Names already in Latin script (including accents such as "Peñaranda") are left untouched.
let transliterate = null;
try { ({ transliterate } = require('transliteration')); } catch { /* package not installed: names stay as they are */ }
const NEEDS_LATIN = /[^\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]/u;
exports.toLatin = (s = '') => {
  if (!s || !transliterate || !NEEDS_LATIN.test(s)) return s;
  try { return transliterate(s).replace(/\s+/g, ' ').replace(/\s+,/g, ',').trim() || s; } catch { return s; }
};