const mongoose = require('mongoose');

/**
 * A FamilyGroup is owned by exactly one User whose role is 'family_admin'
 * (enforced in familyController, not at the schema level, since role
 * transitions are an application-level decision).
 *
 * `members[]` is the source-of-truth ledger of who's in the group and
 * whether they currently have a premium grant. User.familyAccess is a
 * denormalized cache of the SAME grant for fast lookups — both are updated
 * together in familyController, never independently.
 */
const familyGroupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // one group per family_admin, by design — see README
  },
  maxMembers: { type: Number, default: 5, min: 1, max: 50 },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    addedAt: { type: Date, default: Date.now },
    isPremiumGranted: { type: Boolean, default: false },
    grantedAt: { type: Date },
  }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('FamilyGroup', familyGroupSchema);
