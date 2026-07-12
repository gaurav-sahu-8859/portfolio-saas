const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const { getRazorpay, isConfigured } = require('../config/razorpay');
const { PRO_PLAN_AMOUNT_PAISE, CURRENCY } = require('../config/pricing');
const Payment = require('../models/Payment');
const PaymentVerification = require('../models/PaymentVerification');
const User = require('../models/User');
const { bypassesBilling, grantProAccess } = require('../utils/entitlements');

/* ───────────────────────── PUBLIC ───────────────────────── */

// @desc    Public Razorpay config the pricing page needs before it can render
//          a checkout button (key id is PUBLIC by design — only the secret
//          key and webhook secret ever stay server-side)
// @route   GET /api/payments/config
// @access  Public
const getPublicConfig = asyncHandler(async (req, res) => {
  res.json({
    isConfigured: isConfigured(),
    keyId: process.env.RAZORPAY_KEY_ID || '',
    amount: PRO_PLAN_AMOUNT_PAISE,
    currency: CURRENCY,
  });
});

/* ───────────────────────── USER-FACING (protect) ───────────────────────── */

// @desc    Create a Razorpay order for the Pro plan (or a specific premium
//          theme unlock — same entitlement either way, see Payment.purchasedTheme)
// @route   POST /api/payments/create-order
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  // Same rule as Stripe checkout: platform staff never get charged.
  if (bypassesBilling(req.user)) {
    res.status(400);
    throw new Error('Admin accounts already have full access and do not need to pay');
  }

  const razorpay = getRazorpay();
  if (!razorpay) {
    res.status(503);
    throw new Error('Payments are not configured on this server yet — add RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET to enable checkout');
  }

  const user = await User.findById(req.user._id).select('plan');
  if (user.plan === 'pro') {
    res.status(400);
    throw new Error('You are already on the Pro plan');
  }

  const { themeKey } = req.body; // optional — set when checkout was triggered from a specific locked theme

  // receipt must be <= 40 chars for Razorpay — userId + timestamp fits comfortably.
  const receipt = `pf_${req.user._id}_${Date.now()}`.slice(0, 40);

  const order = await razorpay.orders.create({
    amount: PRO_PLAN_AMOUNT_PAISE,
    currency: CURRENCY,
    receipt,
    notes: { userId: req.user._id.toString(), purchasedTheme: themeKey || 'pro-plan' },
  });

  await Payment.create({
    userId: req.user._id,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    status: 'created',
    purchasedTheme: themeKey || 'pro-plan',
  });

  res.status(201).json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    name: 'PortfolioForge',
    description: themeKey ? `Unlock ${themeKey} theme (Pro plan)` : 'PortfolioForge Pro — monthly',
    prefill: { name: req.user.name, email: req.user.email },
  });
});

// @desc    Verify a completed Razorpay Checkout payment (signature check) and
//          grant Pro access. This is the SYNCHRONOUS confirmation the
//          Checkout success handler calls immediately — the webhook below is
//          the source of truth for anything that happens outside that flow
//          (closed tab, delayed capture, etc.) and applies the exact same
//          upgrade logic idempotently.
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400);
    throw new Error('Missing Razorpay order id, payment id, or signature');
  }

  if (!isConfigured()) {
    res.status(503);
    throw new Error('Payments are not configured on this server yet');
  }

  const payment = await Payment.findOne({ orderId: razorpay_order_id });
  if (!payment) { res.status(404); throw new Error('No matching order found'); }

  // An order belongs to exactly the user who created it — never let one
  // account verify (and thereby claim the Pro upgrade for) another
  // account's order, even if they somehow got hold of its order id.
  if (payment.userId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('This order does not belong to your account');
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const isValid = expectedSignature.length === razorpay_signature.length
    && crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpay_signature));

  if (!isValid) {
    payment.status = 'failed';
    payment.failureReason = 'Signature verification failed';
    await payment.save();
    res.status(400);
    throw new Error('Payment verification failed — signature mismatch');
  }

  payment.status = 'paid';
  payment.paymentId = razorpay_payment_id;
  payment.signature = razorpay_signature;
  await payment.save();

  await grantProAccess(payment.userId, 'Razorpay');

  const updatedUser = await User.findById(payment.userId).select('plan');
  res.json({ message: 'Payment verified — Pro plan unlocked', plan: updatedUser.plan, purchasedTheme: payment.purchasedTheme });
});

// @desc    Record a failed/abandoned Checkout attempt (called from the
//          Razorpay Checkout `payment.failed` handler on the frontend, and
//          also when the user simply closes the modal without paying)
// @route   POST /api/payments/failure
// @access  Private
const recordFailure = asyncHandler(async (req, res) => {
  const { razorpay_order_id, reason } = req.body;
  if (!razorpay_order_id) { res.status(400); throw new Error('razorpay_order_id is required'); }

  const payment = await Payment.findOne({ orderId: razorpay_order_id, userId: req.user._id });
  if (payment && payment.status === 'created') {
    payment.status = 'failed';
    payment.failureReason = reason || 'Payment was not completed';
    await payment.save();
  }
  res.json({ message: 'Recorded' });
});

// @desc    Current user's own payment history — BOTH methods combined
//          (Razorpay + Manual UPI), normalized to one shape and sorted by
//          date. Powers a simple "past payments" list and lets the retry UI
//          check whether a previous attempt actually went through before
//          offering to retry.
// @route   GET /api/payments/me
// @access  Private
const listMyPayments = asyncHandler(async (req, res) => {
  const [razorpayPayments, upiClaims] = await Promise.all([
    Payment.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(20).lean(),
    PaymentVerification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(20).lean(),
  ]);

  const normalized = [
    ...razorpayPayments.map((p) => ({
      _id: p._id,
      method: 'razorpay',
      amount: p.amount,
      currency: p.currency,
      discountAmount: 0,
      status: p.status, // 'created' | 'paid' | 'failed'
      purchasedTheme: p.purchasedTheme,
      transactionId: p.paymentId || p.orderId,
      screenshotUrl: null,
      failureReason: p.failureReason,
      createdAt: p.createdAt,
    })),
    ...upiClaims.map((v) => ({
      _id: v._id,
      method: 'manual_upi',
      amount: v.amount,
      currency: v.currency,
      discountAmount: v.discountAmount,
      // PaymentVerification's own tri-state maps onto the same vocabulary
      // Payment uses, so the frontend can render both with one status pill:
      // pending→'created', approved→'paid', rejected→'failed'.
      status: v.status === 'approved' ? 'paid' : v.status === 'rejected' ? 'failed' : 'created',
      purchasedTheme: v.purchasedTheme,
      transactionId: v.utr || null,
      screenshotUrl: v.screenshotUrl || null,
      failureReason: v.status === 'rejected' ? (v.adminNote || 'Rejected by admin') : '',
      createdAt: v.createdAt,
    })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ payments: normalized });
});

/* ───────────────────────── WEBHOOK (no auth — verified by signature) ───────────────────────── */

// @desc    Razorpay webhook — source of truth for payment state changes that
//          happen outside the Checkout success callback (network drop right
//          after payment, delayed/async capture, etc.)
// @route   POST /api/payments/webhook
// @access  Public (signature-verified, mounted with raw body in server.js)
const handleWebhook = asyncHandler(async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) { return res.status(503).send('Webhook not configured'); }

  const signature = req.headers['x-razorpay-signature'];
  const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(req.body).digest('hex');

  if (!signature || expectedSignature.length !== signature.length
      || !crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))) {
    console.error('[razorpayController] Webhook signature verification failed');
    return res.status(400).send('Invalid webhook signature');
  }

  const event = JSON.parse(req.body.toString('utf8'));

  switch (event.event) {
    case 'payment.captured': {
      const entity = event.payload?.payment?.entity;
      if (entity?.order_id) {
        const payment = await Payment.findOne({ orderId: entity.order_id });
        // Idempotent: the synchronous /verify call usually wins this race
        // and already marked it paid — the webhook just confirms it, never
        // double-applies the upgrade.
        if (payment && payment.status !== 'paid') {
          payment.status = 'paid';
          payment.paymentId = entity.id;
          await payment.save();
          await grantProAccess(payment.userId, 'Razorpay');
        }
      }
      break;
    }
    case 'payment.failed': {
      const entity = event.payload?.payment?.entity;
      if (entity?.order_id) {
        const payment = await Payment.findOne({ orderId: entity.order_id });
        if (payment && payment.status === 'created') {
          payment.status = 'failed';
          payment.failureReason = entity.error_description || 'Payment failed';
          await payment.save();
        }
      }
      break;
    }
    default:
      break; // ignore events we don't act on
  }

  res.json({ received: true });
});

/* ───────────────────────── INTERNAL HELPER ───────────────────────── */

// applyProUpgrade replaced by the shared entitlements.grantProAccess — see
// its two call sites below.

module.exports = {
  getPublicConfig,
  createOrder,
  verifyPayment,
  recordFailure,
  listMyPayments,
  handleWebhook,
};
