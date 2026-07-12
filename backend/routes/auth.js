const express = require('express');
const router = express.Router();
const {
  register, login, getMe, changePassword, checkUsername,
  forgotPassword, resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.get('/check-username/:username', checkUsername);

// Both public — protected by the existing authLimiter mounted on the whole
// /api/auth router in server.js (10 req/15min), which is exactly the right
// brute-force guard for both "spam someone's inbox with reset emails" and
// "guess a reset token" attempts. No changes needed to that wiring.
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

module.exports = router;
