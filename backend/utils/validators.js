exports.isEmail = (v) => /^\S+@\S+\.\S+$/.test(v || '');
exports.validCoords = (lat, lon) => Number.isFinite(+lat) && Number.isFinite(+lon) && Math.abs(+lat) <= 90 && Math.abs(+lon) <= 180;
exports.strongPassword = (v) => typeof v === 'string' && v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v);
exports.allowedDomains = () => (process.env.ALLOWED_EMAIL_DOMAINS || 'gmail.com').split(',').map((d) => d.trim().toLowerCase()).filter(Boolean);
exports.emailAllowed = (v) => exports.allowedDomains().includes(String(v || '').split('@')[1]?.toLowerCase());