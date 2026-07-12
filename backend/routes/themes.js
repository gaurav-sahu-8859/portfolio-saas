const express = require('express');
const router = express.Router();
const { getEnabledThemes } = require('../controllers/themeController');
const { protect } = require('../middleware/authMiddleware');

// Any authenticated user (admin or normal) can read the ENABLED catalog —
// this is what powers their own theme switcher. It deliberately cannot
// mutate anything; write access lives only under /api/admin/themes.
router.get('/', protect, getEnabledThemes);

module.exports = router;
