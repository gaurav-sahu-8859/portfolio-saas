const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { getStripe, isConfigured } = require('../config/stripe');
const { bypassesBilling, isPremiumEntitled } = require('../utils/entitlements');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/* ───────────────────────── USER-FACING (protect) ───────────────────────── */

// @desc    Get the current user's plan/subscription status
// @route   GET /api/billing/me
// @access  Private
const getMyBilling = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('plan role familyAccess subscriptionStatus currentPeriodEnd stripeCustomerId');
  res.json({
    plan: user.plan,
    role: user.role,
    subscriptionStatus: user.subscriptionStatus,
    currentPeriodEnd: user.currentPeriodEnd,
    billingConfigured: isConfigured(),
    bypassesBilling: bypassesBilling(user), // admin / super_admin — UI should hide "Upgrade" entirely
    entitlement: isPremiumEntitled(user),
  });
});

// @desc    Start a Stripe Checkout session to upgrade to Pro
// @route   POST /api/billing/create-checkout-session
// @access  Private
const createCheckoutSession = asyncHandler(async (req, res) => {
  // Admins and super_admins are platform staff, not customers — they
  // already have full entitlement via isPremiumEntitled() and must never
  // be charged. This is checked BEFORE we even look at Stripe config, so
  // it can't accidentally create a customer/checkout session for them.
  if (bypassesBilling(req.user)) {
    res.status(400);
    throw new Error('Admin accounts already have full access and do not need to subscribe');
  }

  const stripe = getStripe();
  if (!stripe) {
    res.status(503);
    throw new Error('Billing is not configured on this server yet — add STRIPE_SECRET_KEY to enable upgrades');
  }
  if (!process.env.STRIPE_PRICE_ID_PRO) {
    res.status(503);
    throw new Error('STRIPE_PRICE_ID_PRO is not set — create a Price in Stripe and add its ID to .env');
  }

  const user = await User.findById(req.user._id);
  if (user.plan === 'pro') {
    res.status(400);
    throw new Error('You are already on the Pro plan');
  }

  // Reuse an existing Stripe customer if we've already created one for this user.
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user._id.toString() },
    });
    customerId = customer.id;
    user.stripeCustomerId = customerId;
    await user.save({ validateBeforeSave: false });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: process.env.STRIPE_PRICE_ID_PRO, quantity: 1 }],
    success_url: `${FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${FRONTEND_URL}/billing/cancel`,
    client_reference_id: user._id.toString(),
    metadata: { userId: user._id.toString() },
  });

  res.json({ url: session.url });
});

// @desc    Open the Stripe Customer Portal so a Pro user can manage/cancel
// @route   POST /api/billing/create-portal-session
// @access  Private
const createPortalSession = asyncHandler(async (req, res) => {
  const stripe = getStripe();
  if (!stripe) {
    res.status(503);
    throw new Error('Billing is not configured on this server yet');
  }

  const user = await User.findById(req.user._id);
  if (!user.stripeCustomerId) {
    res.status(400);
    throw new Error('No billing account found for this user yet');
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${FRONTEND_URL}/dashboard/settings`,
  });

  res.json({ url: portalSession.url });
});

// @desc    Synchronous fallback confirmation after Checkout redirect.
//          The webhook is the source of truth in production, but reading the
//          session back immediately on the success page means the UI never
//          has to sit there guessing while waiting on webhook delivery —
//          this safely re-applies the exact same upgrade logic.
// @route   GET /api/billing/verify-session?session_id=xxx
// @access  Private
const verifySession = asyncHandler(async (req, res) => {
  const stripe = getStripe();
  if (!stripe) { res.status(503); throw new Error('Billing is not configured on this server yet'); }

  const { session_id } = req.query;
  if (!session_id) { res.status(400); throw new Error('session_id is required'); }

  const session = await stripe.checkout.sessions.retrieve(session_id, { expand: ['subscription'] });

  if (session.client_reference_id !== req.user._id.toString()) {
    res.status(403);
    throw new Error('This checkout session does not belong to your account');
  }

  if (session.payment_status === 'paid' || session.status === 'complete') {
    await applyProUpgrade(req.user._id, session.customer, session.subscription);
  }

  const user = await User.findById(req.user._id).select('plan subscriptionStatus currentPeriodEnd');
  res.json({ plan: user.plan, subscriptionStatus: user.subscriptionStatus, currentPeriodEnd: user.currentPeriodEnd });
});

/* ───────────────────────── INTERNAL HELPER ───────────────────────── */

async function applyProUpgrade(userId, customerId, subscription) {
  const update = {
    plan: 'pro',
    stripeCustomerId: typeof customerId === 'string' ? customerId : customerId?.id,
  };
  if (subscription && typeof subscription === 'object') {
    update.stripeSubscriptionId = subscription.id;
    update.subscriptionStatus = subscription.status;
    if (subscription.current_period_end) {
      update.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    }
  } else if (typeof subscription === 'string') {
    update.stripeSubscriptionId = subscription;
    update.subscriptionStatus = 'active';
  }
  await User.findByIdAndUpdate(userId, { $set: update });
}

/* ───────────────────────── STRIPE WEBHOOK (no auth — verified by signature) ───────────────────────── */

// @desc    Stripe webhook — source of truth for subscription state changes
// @route   POST /api/billing/webhook
// @access  Public (signature-verified, mounted with raw body in server.js)
const handleWebhook = asyncHandler(async (req, res) => {
  const stripe = getStripe();
  if (!stripe) { return res.status(503).send('Billing not configured'); }

  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.client_reference_id || session.metadata?.userId;
      if (userId) {
        await applyProUpgrade(userId, session.customer, session.subscription);
      }
      break;
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const user = await User.findOne({ stripeCustomerId: sub.customer });
      if (user) {
        user.subscriptionStatus = sub.status;
        user.currentPeriodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : undefined;
        // Only an active/trialing subscription keeps Pro active; anything else downgrades.
        user.plan = ['active', 'trialing'].includes(sub.status) ? 'pro' : 'free';
        await user.save({ validateBeforeSave: false });
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const user = await User.findOne({ stripeCustomerId: sub.customer });
      if (user) {
        user.plan = 'free';
        user.subscriptionStatus = 'canceled';
        await user.save({ validateBeforeSave: false });
      }
      break;
    }
    default:
      break; // ignore events we don't act on
  }

  res.json({ received: true });
});

/* ───────────────────────── DEV-ONLY TEST UTILITY ───────────────────────── */

// @desc    Flip the current user to Pro WITHOUT Stripe — for local testing only.
// @route   POST /api/billing/dev-upgrade
// @access  Private, and only responds outside production
const devUpgrade = asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404);
    throw new Error('Not found');
  }
  await User.findByIdAndUpdate(req.user._id, {
    $set: { plan: 'pro', subscriptionStatus: 'active (dev)' },
  });
  res.json({ message: 'Dev upgrade applied — this route does not exist in production', plan: 'pro' });
});

const devDowngrade = asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404);
    throw new Error('Not found');
  }
  await User.findByIdAndUpdate(req.user._id, {
    $set: { plan: 'free', subscriptionStatus: '' },
  });
  res.json({ message: 'Dev downgrade applied', plan: 'free' });
});

module.exports = {
  getMyBilling,
  createCheckoutSession,
  createPortalSession,
  verifySession,
  handleWebhook,
  devUpgrade,
  devDowngrade,
};
