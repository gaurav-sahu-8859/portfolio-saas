const express = require('express');
const router = express.Router();
const {
  getAdminConfig, updateAdminConfig, listVerifications, approveVerification, rejectVerification,
  getAdminPaymentHistory,
} = require('../controllers/paymentController');
const { protect, admin } = require('../middleware/authMiddleware');

// Every route below requires admin-tier (admin OR super_admin) — same
// pattern as routes/adminThemes.js.
router.use(protect, admin);

router.get('/config', getAdminConfig);
router.put('/config', updateAdminConfig);
router.get('/verifications', listVerifications);
router.put('/verifications/:id/approve', approveVerification);
router.put('/verifications/:id/reject', rejectVerification);
// Unified view across BOTH payment methods (Razorpay + Manual UPI) — see
// paymentController.getAdminPaymentHistory for how they're merged.
router.get('/history', getAdminPaymentHistory);

module.exports = router;
