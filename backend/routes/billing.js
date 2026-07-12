const express = require('express');
const router = express.Router();
const {
  getMyBilling, createCheckoutSession, createPortalSession, verifySession,
  devUpgrade, devDowngrade,
} = require('../controllers/billingController');
const { protect } = require('../middleware/authMiddleware');

// NOTE: the Stripe webhook (POST /api/billing/webhook) is intentionally NOT
// in this router — it needs the raw request body for signature verification
// and no JWT (Stripe authenticates via signature instead). It's mounted
// directly in server.js, before the global express.json() middleware.

router.get('/me', protect, getMyBilling);
router.post('/create-checkout-session', protect, createCheckoutSession);
router.post('/create-portal-session', protect, createPortalSession);
router.get('/verify-session', protect, verifySession);

// Dev-only test routes — the controllers themselves 404 in production,
// this is just keeping them out of the route list too for clarity.
if (process.env.NODE_ENV !== 'production') {
  router.post('/dev-upgrade', protect, devUpgrade);
  router.post('/dev-downgrade', protect, devDowngrade);
}

module.exports = router;
