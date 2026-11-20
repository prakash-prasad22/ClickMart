const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { STAFF_ROLES, can } = require('../config/permissions');

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function signToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

function setAuthCookie(res, token) {
  res.cookie(env.COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProd,
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

function clearAuthCookie(res) {
  res.clearCookie(env.COOKIE_NAME, { path: '/' });
}

function readToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return req.cookies?.[env.COOKIE_NAME];
}

async function resolveUser(req) {
  const token = readToken(req);
  if (!token) return null;
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) return null;
    return user;
  } catch {
    return null;
  }
}

async function authenticate(req, _res, next) {
  const user = await resolveUser(req);
  if (!user) return next(ApiError.unauthorized());
  req.user = user;
  next();
}

async function optionalAuth(req, _res, next) {
  req.user = await resolveUser(req);
  next();
}

function requireStaff(req, _res, next) {
  if (!req.user || !STAFF_ROLES.includes(req.user.role)) return next(ApiError.forbidden());
  next();
}

// Gate a router to a permission module (see config/permissions.js)
const allow = (module) => (req, _res, next) =>
  can(req.user?.role, module) ? next() : next(ApiError.forbidden());

module.exports = { signToken, setAuthCookie, clearAuthCookie, authenticate, optionalAuth, requireStaff, allow };
