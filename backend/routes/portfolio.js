const express = require('express');
const router = express.Router();
const { getMyPortfolio, updatePortfolio, updateMyTheme, togglePublish, getStats, viewMyResume } = require('../controllers/portfolioController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getMyPortfolio);
router.put('/', protect, updatePortfolio);
router.put('/theme', protect, updateMyTheme);
router.put('/publish', protect, togglePublish);
router.get('/stats', protect, getStats);
router.get('/resume', protect, viewMyResume);

module.exports = router;
