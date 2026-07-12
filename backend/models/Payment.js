const mongoose = require('mongoose');

// One document per Razorpay order attempt. Created (status: 'created') the
// moment we ask Razorpay for an order — BEFORE the user ever sees the
// Checkout modal — so every attempt is auditable even if the user closes
// the modal or the payment fails, not just the successful ones.
const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  // Razorpay identifiers. orderId exists from the moment the order is
  // created; paymentId + signature are only populated once Razorpay
  // Checkout actually completes a payment attempt against that order.
  orderId: { type: String, required: true, unique: true },
  paymentId: { type: String, default: '' },
  signature: { type: String, default: '' },

  amount: { type: Number, required: true }, // smallest currency unit (paise for INR), matches what Razorpay expects/returns
  currency: { type: String, default: 'INR' },

  // 'created'  → order created, checkout not yet completed
  // 'paid'     → signature verified (or webhook-confirmed) successfully
  // 'failed'   → Razorpay reported a failed payment for this order
  status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created', index: true },

  // What this purchase unlocks. Today every paid order unlocks the whole
  // Pro plan (see entitlements.js) — 'pro-plan' is the default. Kept as a
  // free-form string (rather than a hard ref to Theme) so a future
  // per-theme purchase flow can stamp a specific theme key here without a
  // schema migration; the checkout entry point already threads a theme key
  // through when the user clicked "Unlock" on a specific locked theme.
  purchasedTheme: { type: String, default: 'pro-plan' },

  failureReason: { type: String, default: '' },
}, { timestamps: true }); // createdAt + updatedAt

module.exports = mongoose.model('Payment', paymentSchema);
