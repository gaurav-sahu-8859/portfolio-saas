const mongoose = require('mongoose');

/**
 * Platform-wide UPI payment configuration. Singleton by convention — the
 * controller always does findOne() (creating one with defaults if it
 * doesn't exist yet) rather than ever creating a second document. This
 * mirrors how Theme catalog entries are admin-managed data, not user data,
 * just with exactly one document instead of many.
 *
 * No payment gateway integration — a UPI ID is meant to be shown publicly
 * to receive transfers (like a bank account number), so there's nothing
 * sensitive stored here that needs special protection.
 *
 * ── Visibility ──────────────────────────────────────────────────────────
 * `isEnabled` is the global kill switch (unchanged from before). On top of
 * that, `visibilityMode` narrows WHO sees it once it's on:
 *   'all'       → every logged-in user (previous, only behavior)
 *   'allowlist' → only users listed in `allowedUsers`
 * A logged-OUT visitor never sees Manual UPI regardless of mode — there's
 * no user to check the allowlist against, and the discounted price is
 * meant to be earned/targeted, not public. See controllers/paymentController.js
 * getPublicConfig, which is the only place that actually enforces this.
 *
 * ── Discount pricing ────────────────────────────────────────────────────
 * The "original" price is deliberately NOT duplicated here — it's always
 * read live from the same place Razorpay's price comes from
 * (RAZORPAY_PRO_PLAN_AMOUNT_PAISE, see controllers/razorpayController.js),
 * so the two payment methods can never silently drift apart into showing
 * two different "full" prices. Only the DISCOUNT itself is UPI-specific,
 * stored as either a percentage or a flat amount off that shared base
 * price — never both, `discountType` picks which one is active. The
 * "Final Payable Amount" the admin sees while editing, and that gets
 * quoted to the user, is always COMPUTED server-side from these two
 * fields (see computeUpiPricing() in paymentController.js), never stored
 * or trusted as raw client input — that keeps percentage/flat/final
 * always mathematically consistent with each other.
 */
const paymentConfigSchema = new mongoose.Schema({
  isEnabled: { type: Boolean, default: false },
  upiId: { type: String, default: '', trim: true }, // e.g. "name@upi" / "name@paytm"
  payeeName: { type: String, default: '', trim: true },
  // Admin can upload a static QR image (via the existing image upload
  // endpoint); if blank, the frontend falls back to auto-generating one
  // from the UPI string via a free public QR rendering service — no
  // payment gateway and no new backend dependency required for that.
  qrCodeUrl: { type: String, default: '' },
  note: { type: String, default: '', trim: true, maxlength: 300 },

  visibilityMode: { type: String, enum: ['all', 'allowlist'], default: 'all' },
  allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Which purchasable products this applies to — matches the same
  // `purchasedTheme` strings Razorpay orders use ('pro-plan', or a
  // specific theme key). Empty array = eligible for all of them, which is
  // the sensible default since this app has one real product (Pro) today;
  // kept as a list so a future multi-product catalog doesn't need a
  // schema change, per the "per subscription plan (optional)" requirement.
  eligiblePlans: [{ type: String, trim: true }],

  discountType: { type: String, enum: ['none', 'percentage', 'flat'], default: 'none' },
  discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
  discountAmount: { type: Number, default: 0, min: 0 }, // paise

  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('PaymentConfig', paymentConfigSchema);
