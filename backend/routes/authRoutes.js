const r = require('express').Router();
const c = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({ windowMs: 15 * 60_000, max: 20 });

r.get('/setup-status', c.setupStatus);
r.post('/setup/send-code', limiter, c.sendSetupCode);
r.post('/setup/verify', limiter, c.verifySetup);
r.post('/login', limiter, c.login);
r.post('/forgot/send-code', limiter, c.forgotSendCode);
r.post('/forgot/verify', limiter, c.forgotVerify);
r.post('/forgot/reset', limiter, c.forgotReset);
r.get('/me', protect, c.me);
r.put('/profile', protect, c.updateProfile);
r.put('/password', protect, c.changePassword);
module.exports = r;