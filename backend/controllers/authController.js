const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const EmailVerification = require('../models/EmailVerification');
const mail = require('../services/mailService');
const { asyncHandler, ok, fail } = require('../utils/helpers');
const { isEmail, strongPassword, emailAllowed, allowedDomains } = require('../utils/validators');
const PasswordReset = require('../models/PasswordReset');


const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, preferences: u.preferences });
const allowRegistration = () => String(process.env.ALLOW_REGISTRATION ?? 'true').toLowerCase() !== 'false';
const canRegister = async () => allowRegistration() || (await User.countDocuments()) === 0;

// Single-user system: setup only works while no account exists.
exports.setupStatus = asyncHandler(async (_req, res) => {
  const count = await User.countDocuments();
  ok(res, { needsSetup: count === 0, registrationOpen: allowRegistration() || count === 0, allowedDomains: allowedDomains() });
});

function checkSignup({ name, email, password, confirmPassword }) {
  if (!name || !name.trim()) return 'Name is required';
  if (!isEmail(email)) return 'Enter a valid email address';
  if (!emailAllowed(email)) return `Email must end with ${allowedDomains().map((d) => '@' + d).join(' or ')}`;
  if (!strongPassword(password)) return 'Password needs 8+ characters with letters and numbers';
  if (password !== confirmPassword) return 'Passwords do not match';
  return null;
}

// Step 1: validate the form and email a 6-digit code. Nothing is created yet.
exports.sendSetupCode = asyncHandler(async (req, res) => {
  if (!(await canRegister())) return fail(res, 403, 'Registration is closed');
  const bad = checkSignup(req.body);
  if (bad) return fail(res, 400, bad);
  const email = req.body.email.toLowerCase().trim();
  if (await User.findOne({ email })) return fail(res, 409, 'An account with this email already exists. Try logging in.');
  const prev = await EmailVerification.findOne({ email });
  const wait = prev ? 60000 - (Date.now() - prev.lastSentAt) : 0;
  if (wait > 0) return fail(res, 429, `Please wait ${Math.ceil(wait / 1000)} seconds before requesting another code`);
  const code = String(crypto.randomInt(100000, 1000000));
  await EmailVerification.findOneAndUpdate(
    { email },
    { codeHash: await bcrypt.hash(code, 10), attempts: 0, lastSentAt: new Date(), expiresAt: new Date(Date.now() + 10 * 60000) },
    { upsert: true }
  );
  try { await mail.sendVerificationCode(email, code); }
  catch (e) { await EmailVerification.deleteOne({ email }); throw e; }
  ok(res, { sent: true, expiresInMinutes: 10 });
});

// Step 2: check the code, then create the account.
exports.verifySetup = asyncHandler(async (req, res) => {
  if (!(await canRegister())) return fail(res, 403, 'Registration is closed');
  const bad = checkSignup(req.body);
  if (bad) return fail(res, 400, bad);
  const email = req.body.email.toLowerCase().trim();
  const code = String(req.body.code || '').trim();
  if (!/^\d{6}$/.test(code)) return fail(res, 400, 'Enter the 6-digit code');
  if (await User.findOne({ email })) return fail(res, 409, 'An account with this email already exists. Try logging in.');
  const rec = await EmailVerification.findOne({ email });
  if (!rec || rec.expiresAt < new Date()) return fail(res, 400, 'The code expired. Request a new one');
  if (rec.attempts >= 5) { await rec.deleteOne(); return fail(res, 429, 'Too many wrong attempts. Request a new code'); }
  if (!(await bcrypt.compare(code, rec.codeHash))) { rec.attempts += 1; await rec.save(); return fail(res, 400, 'That code is not correct'); }
  await rec.deleteOne();
  const user = await User.create({ name: req.body.name.trim(), email, password: req.body.password });
  ok(res, { token: sign(user._id), user: publicUser(user) }, 201);
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase() });
  if (!user || !(await user.matches(password || ''))) return fail(res, 401, 'Invalid email or password');
  ok(res, { token: sign(user._id), user: publicUser(user) });
});

exports.me = asyncHandler(async (req, res) => ok(res, req.user));

exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, email, preferences } = req.body;
  if (email && !isEmail(email)) return fail(res, 400, 'Invalid email');
  const user = await User.findById(req.user._id);
  if (name) user.name = name;
  if (email) user.email = email;
  if (preferences) user.preferences = { ...user.preferences.toObject(), ...preferences };
  await user.save();
  ok(res, publicUser(user));
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  if (!(await user.matches(currentPassword || ''))) return fail(res, 400, 'Current password is incorrect');
  if (!strongPassword(newPassword)) return fail(res, 400, 'Password needs 8+ characters with letters and numbers');
  user.password = newPassword;
  await user.save();
  ok(res, { message: 'Password updated' });
});

// ---------- Forgot password ----------
// Reset tokens use a different secret, so they can never be used as a normal login token.
const resetSecret = () => `${process.env.JWT_SECRET}:reset`;

// Step 1: email a 6-digit code. The reply is the same whether or not the email has an account.
exports.forgotSendCode = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim();
  if (!isEmail(email)) return fail(res, 400, 'Enter a valid email address');
  const user = await User.findOne({ email });
  if (!user) return ok(res, { sent: true, expiresInMinutes: 10 });
  const prev = await PasswordReset.findOne({ email });
  const wait = prev ? 60000 - (Date.now() - prev.lastSentAt) : 0;
  if (wait > 0) return fail(res, 429, `Please wait ${Math.ceil(wait / 1000)} seconds before requesting another code`);
  const code = String(crypto.randomInt(100000, 1000000));
  await PasswordReset.findOneAndUpdate(
    { email },
    { codeHash: await bcrypt.hash(code, 10), attempts: 0, lastSentAt: new Date(), expiresAt: new Date(Date.now() + 10 * 60000) },
    { upsert: true }
  );
  try { await mail.sendVerificationCode(email, code); }
  catch (e) { await PasswordReset.deleteOne({ email }); throw e; }
  ok(res, { sent: true, expiresInMinutes: 10 });
});

// Step 2: check the code. On success, return a short-lived token that allows one password reset.
exports.forgotVerify = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim();
  const code = String(req.body.code || '').trim();
  if (!/^\d{6}$/.test(code)) return fail(res, 400, 'Enter the 6-digit code');
  const rec = await PasswordReset.findOne({ email });
  const user = await User.findOne({ email });
  if (!rec || !user || rec.expiresAt < new Date()) return fail(res, 400, 'The code is invalid or expired. Request a new one');
  if (rec.attempts >= 5) { await rec.deleteOne(); return fail(res, 429, 'Too many wrong attempts. Request a new code'); }
  if (!(await bcrypt.compare(code, rec.codeHash))) { rec.attempts += 1; await rec.save(); return fail(res, 400, 'That code is not correct'); }
  await rec.deleteOne();
  const resetToken = jwt.sign({ id: user._id, purpose: 'reset', ph: user.password.slice(-12) }, resetSecret(), { expiresIn: '10m' });
  ok(res, { resetToken });
});

// Step 3: set the new password, then log the user in.
exports.forgotReset = asyncHandler(async (req, res) => {
  const { resetToken, newPassword, confirmPassword } = req.body;
  let payload;
  try { payload = jwt.verify(resetToken || '', resetSecret()); }
  catch { return fail(res, 400, 'Your reset session expired. Please start again'); }
  if (payload.purpose !== 'reset') return fail(res, 400, 'Invalid reset session');
  if (!strongPassword(newPassword)) return fail(res, 400, 'Password needs 8+ characters with letters and numbers');
  if (newPassword !== confirmPassword) return fail(res, 400, 'Passwords do not match');
  const user = await User.findById(payload.id);
  // The token only works while the password is unchanged, so it can be used once.
  if (!user || user.password.slice(-12) !== payload.ph) return fail(res, 400, 'This reset session was already used. Please start again');
  user.password = newPassword;
  await user.save();
  ok(res, { token: sign(user._id), user: publicUser(user) });
});