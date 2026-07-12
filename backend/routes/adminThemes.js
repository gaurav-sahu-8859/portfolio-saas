const express = require('express');
const router = express.Router();
const {
  getAllThemes, createTheme, updateTheme, deleteTheme, setDefaultTheme
} = require('../controllers/themeController');
const { protect, admin } = require('../middleware/authMiddleware');

// EVERY route below requires: (1) a valid JWT, AND (2) role === 'admin'.
// A normal user's valid token still gets rejected here with 403 — `admin`
// middleware checks req.user.role, not just whether a token exists.
// This is the only place theme catalog data can be created/edited/deleted/defaulted.
router.use(protect, admin);

router.get('/', getAllThemes);
router.post('/', createTheme);
router.put('/:id/set-default', setDefaultTheme);
router.put('/:id', updateTheme);
router.delete('/:id', deleteTheme);

module.exports = router;
