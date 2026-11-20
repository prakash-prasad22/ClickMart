const crypto = require('crypto');
const { Router } = require('express');
const env = require('../config/env');
const User = require('../models/User');
const Otp = require('../models/Otp');
const ApiError = require('../utils/ApiError');
const { sendSms, normalizePhone } = require('../utils/sms');
const { logActivity } = require('../utils/activity');
const { STAFF_ROLES, permissionsFor } = require('../config/permissions');
const { signToken, setAuthCookie, clearAuthCookie, authenticate, optionalAuth } = require('../middleware/auth');

const router = Router();
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 30 * 1000;

const hashCode = (phone, code) => crypto.createHmac('sha256', env.JWT_SECRET).update(`${phone}:${code}`).digest('hex');

const publicUser = (user) => ({ ...user.toSafeJSON(), permissions: permissionsFor(user.role) });

// ── Customer OTP login ────────────────────────────────────────────
router.post('/otp/send', async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  if (!phone) throw ApiError.badRequest('Enter a valid mobile number');

  const recent = await Otp.findOne({ phone }).sort('-createdAt');
  if (recent && Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    throw new ApiError(429, 'Please wait a few seconds before requesting another code');
  }

  const code = String(crypto.randomInt(0, 10 ** env.OTP_LENGTH)).padStart(env.OTP_LENGTH, '0');
  await Otp.deleteMany({ phone });
  await Otp.create({
    phone,
    codeHash: hashCode(phone, code),
    expiresAt: new Date(Date.now() + env.OTP_TTL_MINUTES * 60 * 1000),
  });
  await sendSms(phone, `${code} is your ClickMart verification code. Valid for ${env.OTP_TTL_MINUTES} minutes. Do not share it with anyone.`);

  res.json({
    ok: true,
    phone,
    expiresIn: env.OTP_TTL_MINUTES * 60,
    // Convenience for local development only — never returned in production.
    ...(!env.isProd && env.SMS_PROVIDER === 'console' && { devOtp: code }),
  });
});

router.post('/otp/verify', async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const code = String(req.body.code || '').trim();
  if (!phone || !code) throw ApiError.badRequest('Phone and code are required');

  const otp = await Otp.findOne({ phone }).sort('-createdAt');
  if (!otp || otp.expiresAt < new Date()) throw ApiError.badRequest('Code expired. Please request a new one');
  if (otp.attempts >= MAX_ATTEMPTS) {
    await otp.deleteOne();
    throw new ApiError(429, 'Too many attempts. Please request a new code');
  }

  const expected = Buffer.from(otp.codeHash, 'hex');
  const given = Buffer.from(hashCode(phone, code), 'hex');
  if (!crypto.timingSafeEqual(expected, given)) {
    otp.attempts += 1;
    await otp.save();
    throw ApiError.badRequest('Incorrect code. Please try again');
  }
  await Otp.deleteMany({ phone });

  let user = await User.findOne({ phone });
  const isNew = !user;
  if (!user) user = new User({ phone, role: 'customer' });
  if (!user.isActive) throw ApiError.forbidden('Your account has been suspended. Please contact support');
  if (req.body.name && !user.name) user.name = String(req.body.name).trim().slice(0, 80);
  user.lastLoginAt = new Date();
  await user.save();

  setAuthCookie(res, signToken(user));
  res.json({ user: publicUser(user), isNew });
});

// ── Staff / admin login (email + password) ────────────────────────
router.post('/admin/login', async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim();
  const password = String(req.body.password || '');
  if (!email || !password) throw ApiError.badRequest('Email and password are required');

  const user = await User.findOne({ email, role: { $in: STAFF_ROLES } }).select('+password');
  if (!user || !(await user.comparePassword(password))) throw ApiError.unauthorized('Invalid email or password');
  if (!user.isActive) throw ApiError.forbidden('This account is disabled');

  user.lastLoginAt = new Date();
  await user.save();
  setAuthCookie(res, signToken(user));
  req.user = user;
  logActivity(req, 'signed_in', 'Auth', user._id);
  res.json({ user: publicUser(user) });
});

router.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get('/me', optionalAuth, (req, res) => {
  res.json({ user: req.user ? publicUser(req.user) : null });
});

router.patch('/me', authenticate, async (req, res) => {
  const { name, email } = req.body;
  if (name !== undefined) req.user.name = String(name).trim().slice(0, 80);
  if (email !== undefined) req.user.email = String(email).trim().toLowerCase() || undefined;
  await req.user.save();
  res.json({ user: publicUser(req.user) });
});

module.exports = router;
