const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized, user not found');
    }
    if (!req.user.isActive) {
      res.status(401);
      throw new Error('Account has been deactivated');
    }
    next();
  } catch (error) {
    res.status(401);
    throw new Error('Not authorized, token failed');
  }
});

// Generic role-gate factory. Every admin-tier route in this app is built
// from this — it's the one place "does this role get in" is decided.
// Usage: router.use(protect, authorize('admin', 'super_admin'))
const authorize = (...allowedRoles) => asyncHandler(async (req, res, next) => {
  if (req.user && allowedRoles.includes(req.user.role)) {
    return next();
  }
  res.status(403);
  throw new Error('Access denied: insufficient permissions');
});

// Backward-compatible name, intentionally broadened: ANY admin-tier account
// (admin OR super_admin) passes this. Existing routes that already import
// `{ admin }` automatically start allowing super_admin too — no route files
// needed to change for that part.
const admin = authorize('admin', 'super_admin');

// Strictly the platform owner tier. Used only for the handful of actions
// that must never be delegated to a regular admin: creating/removing other
// admin accounts. Chain this AFTER `admin` on a route to further restrict
// an already admin-gated router to super_admin only.
const superAdmin = authorize('super_admin');

// family_admin manages only their own group; admin/super_admin can act on
// any group for support/oversight. Ownership-of-THIS-group is still checked
// inside the controller (it depends on data, not just role) — this
// middleware only establishes "is this account family-management-capable at all".
const familyAdmin = authorize('family_admin', 'admin', 'super_admin');

// Same JWT check as `protect`, but never rejects the request — an absent,
// expired, or malformed token just leaves `req.user` unset instead of
// throwing 401. Built for the manual-UPI public config endpoint: whether
// Manual UPI is visible now depends on WHICH user is asking (admin-managed
// allowlist), so the route needs to know who's logged in when possible,
// but must still respond (with a "hidden" stub) for logged-out visitors
// rather than blocking the whole pricing page behind a login wall.
const protectOptional = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) { return next(); }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (user && user.isActive) { req.user = user; }
  } catch {
    // Invalid/expired token on an optional route — proceed as anonymous
    // rather than failing the request.
  }
  next();
});

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

module.exports = { protect, protectOptional, admin, superAdmin, familyAdmin, authorize, generateToken };
