/**
 * Single source of truth for "what can this account do" and "is this
 * account currently entitled to premium features". Every controller and
 * the frontend (via the `entitlement` field returned from /api/auth/me,
 * login, register, and portfolio stats) should go through these functions
 * rather than re-deriving role/plan/family logic inline — that's how rules
 * like "admin never gets charged or blocked" stay true in exactly one place.
 */

const ADMIN_ROLES = ['admin', 'super_admin'];

// admin or super_admin — "platform staff", not a customer.
const isAdminRole = (user) => !!user && ADMIN_ROLES.includes(user.role);

const isSuperAdmin = (user) => !!user && user.role === 'super_admin';

const isFamilyAdmin = (user) => !!user && user.role === 'family_admin';

// Admins/super_admins never get charged or blocked by billing/premium logic.
// This is the ONE function that encodes that rule — used in billingController
// to refuse checkout, and in portfolioController's premium theme gate.
const bypassesBilling = (user) => isAdminRole(user);

// "Is this user currently entitled to premium features/themes?"
// Order matters only for readability — any one of these being true is enough.
const isPremiumEntitled = (user) => {
  if (!user) return false;
  if (bypassesBilling(user)) return true;            // admin / super_admin
  if (user.plan === 'pro') return true;               // paid via Stripe
  if (user.familyAccess?.isPremiumGranted) return true; // granted by a family_admin
  return false;
};

// Single place that actually flips a user's plan to Pro. Both payment
// paths (Razorpay signature verification, manual UPI admin approval) call
// this instead of each doing their own User.findByIdAndUpdate — so if a
// third payment method is ever added, or this needs to also e.g. reset a
// usage counter, there's exactly one place to change.
const mongoose = require('mongoose');
const grantProAccess = async (userId, methodLabel) => {
  const User = mongoose.model('User'); // required lazily to avoid a require-order cycle with models/User.js
  await User.findByIdAndUpdate(userId, {
    $set: { plan: 'pro', subscriptionStatus: `active (${methodLabel})` },
  });
};

module.exports = {
  ADMIN_ROLES,
  isAdminRole,
  isSuperAdmin,
  isFamilyAdmin,
  bypassesBilling,
  isPremiumEntitled,
  grantProAccess,
};
