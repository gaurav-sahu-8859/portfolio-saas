const express = require('express');
const router = express.Router();
const { getPublicConfig, submitVerification } = require('../controllers/paymentController');
const { protect, protectOptional } = require('../middleware/authMiddleware');

// Public route, but reads req.user when a valid token is present —
// Manual UPI visibility is per-user (admin-managed allowlist), so whether
// this returns real config or the disabled stub depends on WHO's asking,
// not just whether it's globally enabled. See paymentController's
// isEligibleForUpi for the actual rule.
router.get('/config', protectOptional, getPublicConfig);

// Any authenticated user can submit a manual UPI payment claim.
router.post('/verify', protect, submitVerification);

module.exports = router;
