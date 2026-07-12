const express = require('express');
const router = express.Router();
const {
    getPublicPortfolio, searchPortfolios, getOwnerPortfolio,
    viewResumeByUsername, viewOwnerResume
} = require('../controllers/publicController');

router.get('/owner', getOwnerPortfolio);
router.get('/owner/resume', viewOwnerResume);
router.get('/search', searchPortfolios);
// More specific than /:username (different segment count), but placed
// above it anyway for readability — Express matches by exact path shape,
// so /:username (one segment) was never going to swallow /:username/resume
// (two segments) regardless of order, but keeping specific-before-generic
// is the convention used everywhere else in this codebase.
router.get('/:username/resume', viewResumeByUsername);
router.get('/:username', getPublicPortfolio);

module.exports = router;
