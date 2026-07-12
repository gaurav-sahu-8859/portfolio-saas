const asyncHandler = require('express-async-handler');
const PaymentConfig = require('../models/PaymentConfig');
const PaymentVerification = require('../models/PaymentVerification');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { PRO_PLAN_AMOUNT_PAISE, CURRENCY } = require('../config/pricing');
const { bypassesBilling, grantProAccess } = require('../utils/entitlements');
const sendEmail = require('../utils/sendEmail');

/* ───────────────────────── SHARED HELPERS ───────────────────────── */

// The ONE place "what does Manual UPI actually cost right now" is
// calculated. originalAmount always comes from the shared pricing config
// (same number Razorpay charges) — never from a second, independently-
// editable field — specifically so the two payment methods can't be
// configured into quoting two different "full" prices for the same thing.
function computeUpiPricing(config) {
  const originalAmount = PRO_PLAN_AMOUNT_PAISE;
  let discountAmount = 0;

  if (config.discountType === 'percentage') {
    discountAmount = Math.round(originalAmount * (Math.min(Math.max(config.discountPercentage || 0, 0), 100) / 100));
  } else if (config.discountType === 'flat') {
    discountAmount = Math.min(Math.max(config.discountAmount || 0, 0), originalAmount);
  }

  const finalAmount = Math.max(originalAmount - discountAmount, 0);
  return { originalAmount, discountAmount, finalAmount, currency: CURRENCY };
}

// Is THIS user, for THIS product, actually allowed to see/use Manual UPI
// right now? Every gate collapses to one boolean instead of being
// re-derived separately in getPublicConfig vs submitVerification, so a
// user can never see the option rendered but be silently blocked (or vice
// versa — silently accepted despite not being eligible) if the two checks
// ever drifted apart.
function isEligibleForUpi(config, user, purchasedTheme) {
  if (!config || !config.isEnabled || !config.upiId) return false;
  if (!user) return false; // logged-out visitors never see Manual UPI — nothing to check an allowlist against
  if (bypassesBilling(user)) return false; // admins don't need to pay by any method
  if (config.visibilityMode === 'allowlist') {
    const allowed = (config.allowedUsers || []).map((id) => id.toString());
    if (!allowed.includes(user._id.toString())) return false;
  }
  if (config.eligiblePlans && config.eligiblePlans.length > 0) {
    if (!config.eligiblePlans.includes(purchasedTheme || 'pro-plan')) return false;
  }
  return true;
}

const DISABLED_STUB = { isEnabled: false, upiId: '', payeeName: '', qrCodeUrl: '', note: '' };

/* ───────────────────────── PUBLIC / USER-FACING ───────────────────────── */

// @desc    Get the platform's UPI payment config — shown on the pricing
//          page ONLY to users the admin has actually made it visible to.
//          Uses protectOptional: works for logged-out visitors too (always
//          returns the disabled stub for them), but reads req.user when a
//          valid token is present so the allowlist/plan checks can run.
// @route   GET /api/payment/config?theme=pro-plan
// @access  Public (optionally authenticated)
const getPublicConfig = asyncHandler(async (req, res) => {
  const config = await PaymentConfig.findOne({});
  if (!config) { return res.json(DISABLED_STUB); }

  const purchasedTheme = req.query.theme || 'pro-plan';
  if (!isEligibleForUpi(config, req.user, purchasedTheme)) {
    // Deliberately the SAME shape as "not configured at all" — an
    // ineligible user gets no signal (via response shape or timing) about
    // whether Manual UPI exists, is disabled, or just isn't offered to
    // them specifically. The actual upiId/QR/discount never leaves the
    // server for them.
    return res.json(DISABLED_STUB);
  }

  const pricing = computeUpiPricing(config);
  res.json({
    isEnabled: true,
    upiId: config.upiId,
    payeeName: config.payeeName,
    qrCodeUrl: config.qrCodeUrl,
    note: config.note,
    pricing,
  });
});

// @desc    Submit a manual UPI payment claim for admin review
// @route   POST /api/payment/verify
// @access  Private
const submitVerification = asyncHandler(async (req, res) => {
  if (bypassesBilling(req.user)) {
    res.status(400);
    throw new Error('Admin accounts already have full access and do not need to submit a payment');
  }

  const user = await User.findById(req.user._id).select('plan');
  if (user.plan === 'pro') {
    res.status(400);
    throw new Error('You are already on the Pro plan');
  }

  const { utr, note, screenshotUrl, themeKey } = req.body;
  const purchasedTheme = themeKey || 'pro-plan';

  // Re-check eligibility server-side at submission time too — never trust
  // that a user reaching this endpoint was actually shown the option;
  // config could have changed (or they could be calling the API directly)
  // between when they loaded the pricing page and when they submit.
  const config = await PaymentConfig.findOne({});
  if (!isEligibleForUpi(config, req.user, purchasedTheme)) {
    res.status(403);
    throw new Error('Manual UPI payment is not available for your account');
  }

  if (!utr && !screenshotUrl) {
    res.status(400);
    throw new Error('Please provide either a UTR / transaction ID or a payment screenshot');
  }

  const existing = await PaymentVerification.findOne({ user: req.user._id, status: 'pending' });
  if (existing) {
    res.status(400);
    throw new Error('You already have a pending verification — please wait for it to be reviewed');
  }

  // Snapshot the price NOW, server-side — this is what the user actually
  // owed at submission time, independent of any config change afterward.
  const pricing = computeUpiPricing(config);

  const verification = await PaymentVerification.create({
    user: req.user._id,
    utr: utr || '',
    screenshotUrl: screenshotUrl || '',
    note: note || '',
    purchasedTheme,
    currency: pricing.currency,
    originalAmount: pricing.originalAmount,
    discountAmount: pricing.discountAmount,
    amount: pricing.finalAmount,
  });

  res.status(201).json({ message: 'Submitted — an admin will review and activate your Pro plan shortly.', verification });
});

/* ───────────────────────── ADMIN-ONLY ───────────────────────── */

// @desc    Get the full UPI payment config (admin view — same fields as
//          public, plus visibility/discount settings and a live pricing
//          preview so the admin can see the resulting "final amount"
//          while editing, not just the raw percentage/flat inputs)
// @route   GET /api/admin/payment/config
// @access  Admin
const getAdminConfig = asyncHandler(async (req, res) => {
  const config = await PaymentConfig.findOne({}).populate('allowedUsers', 'name email username');
  const base = config ? config.toObject() : {
    isEnabled: false, upiId: '', payeeName: '', qrCodeUrl: '', note: '',
    visibilityMode: 'all', allowedUsers: [], eligiblePlans: [],
    discountType: 'none', discountPercentage: 0, discountAmount: 0,
  };
  res.json({ ...base, pricing: computeUpiPricing(config || base) });
});

// @desc    Update the UPI payment config (creates it on first save)
// @route   PUT /api/admin/payment/config
// @access  Admin
const updateAdminConfig = asyncHandler(async (req, res) => {
  const allowed = [
    'isEnabled', 'upiId', 'payeeName', 'qrCodeUrl', 'note',
    'visibilityMode', 'allowedUsers', 'eligiblePlans',
    'discountType', 'discountPercentage', 'discountAmount',
  ];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  updates.updatedBy = req.user._id;

  const config = await PaymentConfig.findOneAndUpdate(
    {},
    { $set: updates },
    { new: true, upsert: true, runValidators: true }
  ).populate('allowedUsers', 'name email username');
  console.log(`[paymentController] PUT /config — saved by ${req.user.email}. isEnabled=${config.isEnabled}, visibility=${config.visibilityMode}, discount=${config.discountType}`);
  res.json({ ...config.toObject(), pricing: computeUpiPricing(config) });
});

// @desc    List payment verification claims (pending by default)
// @route   GET /api/admin/payment/verifications?status=pending
// @access  Admin
const listVerifications = asyncHandler(async (req, res) => {
  const status = req.query.status || 'pending';
  const filter = status === 'all' ? {} : { status };
  const verifications = await PaymentVerification.find(filter)
    .populate('user', 'name email username plan')
    .populate('reviewedBy', 'name')
    .sort({ createdAt: -1 });
  res.json({ verifications });
});

// @desc    Approve a claim — grants Pro the same way Razorpay does (shared
//          helper), records who/when, and emails the user (or logs to
//          console in dev if SMTP isn't configured — see utils/sendEmail.js)
// @route   PUT /api/admin/payment/verifications/:id/approve
// @access  Admin
const approveVerification = asyncHandler(async (req, res) => {
  const verification = await PaymentVerification.findById(req.params.id).populate('user', 'name email');
  if (!verification) { res.status(404); throw new Error('Verification not found'); }
  if (verification.status !== 'pending') { res.status(400); throw new Error('This verification has already been reviewed'); }

  verification.status = 'approved';
  verification.reviewedBy = req.user._id;
  verification.reviewedAt = new Date();
  if (req.body.adminNote !== undefined) verification.adminNote = req.body.adminNote;
  await verification.save();

  await grantProAccess(verification.user._id, 'UPI manual verification');

  sendEmail({
    to: verification.user.email,
    subject: "You're on PortfolioForge Pro! 🎉",
    text: `Hi ${verification.user.name}, your manual UPI payment has been verified and your Pro plan is now active. Enjoy the premium themes!`,
    html: `<p>Hi ${verification.user.name},</p><p>Your manual UPI payment has been verified and your <strong>Pro plan is now active</strong>. Enjoy the premium themes!</p>`,
  }).catch((e) => console.error('[paymentController] approve email failed to send (non-fatal):', e.message));

  res.json({ message: 'Approved — user upgraded to Pro', verification });
});

// @desc    Reject a claim
// @route   PUT /api/admin/payment/verifications/:id/reject
// @access  Admin
const rejectVerification = asyncHandler(async (req, res) => {
  const verification = await PaymentVerification.findById(req.params.id).populate('user', 'name email');
  if (!verification) { res.status(404); throw new Error('Verification not found'); }
  if (verification.status !== 'pending') { res.status(400); throw new Error('This verification has already been reviewed'); }

  verification.status = 'rejected';
  verification.reviewedBy = req.user._id;
  verification.reviewedAt = new Date();
  if (req.body.adminNote !== undefined) verification.adminNote = req.body.adminNote;
  await verification.save();

  sendEmail({
    to: verification.user.email,
    subject: 'Your PortfolioForge payment could not be verified',
    text: `Hi ${verification.user.name}, we couldn't verify your recent UPI payment claim.${verification.adminNote ? ` Note from our team: ${verification.adminNote}` : ''} Please double check the details and resubmit, or reach out if you believe this is a mistake.`,
    html: `<p>Hi ${verification.user.name},</p><p>We couldn't verify your recent UPI payment claim.${verification.adminNote ? `</p><p><strong>Note from our team:</strong> ${verification.adminNote}` : ''}</p><p>Please double check the details and resubmit, or reach out if you believe this is a mistake.</p>`,
  }).catch((e) => console.error('[paymentController] reject email failed to send (non-fatal):', e.message));

  res.json({ message: 'Rejected', verification });
});

// @desc    Unified payment history — Razorpay + Manual UPI merged into one
//          sorted, normalized list, for admin visibility across both
//          methods in one place instead of two separate screens.
// @route   GET /api/admin/payment/history
// @access  Admin
const getAdminPaymentHistory = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);

  const [razorpayPayments, upiClaims] = await Promise.all([
    Payment.find({}).populate('userId', 'name email username').sort({ createdAt: -1 }).limit(limit).lean(),
    PaymentVerification.find({}).populate('user', 'name email username').populate('reviewedBy', 'name').sort({ createdAt: -1 }).limit(limit).lean(),
  ]);

  const normalized = [
    ...razorpayPayments.map((p) => ({
      _id: p._id,
      method: 'razorpay',
      user: p.userId,
      amount: p.amount,
      originalAmount: p.amount,
      discountAmount: 0,
      currency: p.currency,
      status: p.status,
      purchasedTheme: p.purchasedTheme,
      transactionId: p.paymentId || p.orderId,
      screenshotUrl: null,
      verifiedBy: null, // Razorpay payments are gateway-verified, not human-reviewed — no reviewer to show
      verifiedAt: p.status === 'paid' ? p.updatedAt : null,
      createdAt: p.createdAt,
    })),
    ...upiClaims.map((v) => ({
      _id: v._id,
      method: 'manual_upi',
      user: v.user,
      amount: v.amount,
      originalAmount: v.originalAmount,
      discountAmount: v.discountAmount,
      currency: v.currency,
      status: v.status === 'approved' ? 'paid' : v.status === 'rejected' ? 'failed' : 'created',
      purchasedTheme: v.purchasedTheme,
      transactionId: v.utr || null,
      screenshotUrl: v.screenshotUrl || null,
      adminNote: v.adminNote,
      verifiedBy: v.reviewedBy?.name || null,
      verifiedAt: v.reviewedAt,
      createdAt: v.createdAt,
    })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit);

  res.json({ payments: normalized });
});

module.exports = {
  getPublicConfig, submitVerification,
  getAdminConfig, updateAdminConfig, listVerifications, approveVerification, rejectVerification,
  getAdminPaymentHistory,
  computeUpiPricing, isEligibleForUpi, // exported for potential reuse/testing
};
