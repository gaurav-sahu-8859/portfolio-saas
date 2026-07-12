const mongoose = require('mongoose');

/**
 * A user's claim that they paid via UPI outside any automated gateway —
 * since there's no webhook for a manual UPI transfer, this is the
 * "manual verification" path explicitly requested instead of requiring a
 * paid payment gateway integration. An admin reviews these and approves
 * or rejects; approval flips the user's plan to 'pro' directly (no Stripe
 * or Razorpay involved, separate code path — see entitlements.grantProAccess,
 * shared with the Razorpay flow so both methods upgrade a user the exact
 * same way).
 *
 * amount/originalAmount/discountAmount are a SNAPSHOT of what
 * computeUpiPricing() returned at the moment this claim was submitted —
 * not a live reference to PaymentConfig. If an admin changes the discount
 * next week, last month's already-submitted claims must keep showing the
 * price the user actually saw and paid, not retroactively recalculate.
 */
const paymentVerificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  utr: { type: String, default: '', trim: true, maxlength: 50 }, // UPI transaction reference, if the user has one
  screenshotUrl: { type: String, default: '' }, // uploaded via the existing /api/upload/image endpoint, Cloudinary URL
  note: { type: String, default: '', trim: true, maxlength: 300 }, // the USER's own note, submitted alongside the claim
  adminNote: { type: String, default: '', trim: true, maxlength: 300 }, // reviewer's note, added on approve/reject

  // What this claim is for, and what it was priced at — mirrors the
  // Payment (Razorpay) model's shape so the two can be merged into one
  // unified payment history (see paymentController.getAdminPaymentHistory).
  purchasedTheme: { type: String, default: 'pro-plan' },
  currency: { type: String, default: 'INR' },
  originalAmount: { type: Number, default: 0 }, // paise, pre-discount, snapshotted at submission
  discountAmount: { type: Number, default: 0 }, // paise, snapshotted at submission
  amount: { type: Number, default: 0 }, // paise, final payable — what the user was actually instructed to pay

  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('PaymentVerification', paymentVerificationSchema);
