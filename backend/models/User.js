const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    lowercase: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens and underscores']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  // Role hierarchy: super_admin > admin > family_admin > user.
  // "user" covers both PREMIUM_USER and FREE_USER from the spec — premium
  // vs free is NOT a role, it's a derived entitlement (see utils/entitlements.js)
  // computed from `plan` + `familyAccess`, so billing state changes never
  // have to rewrite a user's authorization role.
  role: {
    type: String,
    enum: ['user', 'family_admin', 'admin', 'super_admin'],
    default: 'user'
  },
  avatar: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },

  // ── Family access (granted by a family_admin, see models/FamilyGroup.js) ──
  // Denormalized onto the user for O(1) entitlement checks on every theme
  // switch / portfolio render, without joining FamilyGroup each time.
  // FamilyGroup.members[] remains the source-of-truth ledger; this is a
  // fast-path cache kept in sync by familyController on grant/revoke/remove.
  familyAccess: {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'FamilyGroup', default: null },
    grantedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isPremiumGranted: { type: Boolean, default: false },
    grantedAt: { type: Date },
  },

  // ── Billing ──────────────────────────────────────────────────────────
  // 'free' unlocks all non-premium themes; 'pro' unlocks everything.
  // Flipped to 'pro' by the Stripe webhook (or the dev-only upgrade route)
  // after a successful checkout — never set directly from arbitrary
  // client input anywhere in the codebase.
  plan: { type: String, enum: ['free', 'pro'], default: 'free' },
  stripeCustomerId: { type: String, default: '' },
  stripeSubscriptionId: { type: String, default: '' },
  subscriptionStatus: { type: String, default: '' }, // active | past_due | canceled | ''
  currentPeriodEnd: { type: Date },

  // ── Password reset ───────────────────────────────────────────────────
  // Only the HASH of the reset token is ever stored — the raw token exists
  // only in the email link and is never persisted anywhere. select:false
  // mirrors `password` above: these never come back on a normal query,
  // you have to explicitly .select('+resetPasswordToken') for it, which
  // only resetPassword() does.
  resetPasswordToken: { type: String, select: false },
  resetPasswordExpire: { type: Date, select: false },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generates a reset token, stores only its SHA-256 hash + a 20-minute
// expiry on `this`, and returns the RAW token so the caller can build the
// email link. The raw value is never written to the database — only the
// hash is, via this.resetPasswordToken below. Caller still must call
// user.save() afterward; this method only mutates the in-memory document.
userSchema.methods.getResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 20 * 60 * 1000; // 20 minutes

  return resetToken;
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  // Defensive — these are select:false so they're already excluded from
  // normal queries, but if a code path ever explicitly selects them this
  // ensures they still never leave the server in a JSON response.
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
