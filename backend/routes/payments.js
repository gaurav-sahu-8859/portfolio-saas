const express = require('express');
const router = express.Router();
const {
  getPublicConfig, createOrder, verifyPayment, recordFailure, listMyPayments,
} = require('../controllers/razorpayController');
const { protect } = require('../middleware/authMiddleware');

// NOTE: the Razorpay webhook (POST /api/payments/webhook) is intentionally
// NOT in this router — like the Stripe webhook, it needs the raw request
// body for signature verification and no JWT (Razorpay authenticates via
// its own signature instead). It's mounted directly in server.js, before
// the global express.json() middleware.

router.get('/config', getPublicConfig);
router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.post('/failure', protect, recordFailure);
router.get('/me', protect, listMyPayments);

module.exports = router;
