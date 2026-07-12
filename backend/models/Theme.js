const mongoose = require('mongoose');

/**
 * Theme catalog entry.
 *
 * This collection is the ADMIN-CURATED layer that controls which of the
 * compiled frontend theme components (see backend/config/implementedThemeKeys.js
 * and frontend/src/themes/index.js) are actually offered to users, and which
 * one new portfolios get by default.
 *
 * `key` must always match a real, implemented frontend component key —
 * this is enforced in themeController.createTheme, not at the schema level,
 * so the whitelist can live in one place (implementedThemeKeys.js).
 */
const themeSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 60,
  },
  description: { type: String, default: '', trim: true, maxlength: 200 },
  previewAccent: { type: String, default: '#6366f1' },
  // Whether normal users can currently select this theme.
  isEnabled: { type: Boolean, default: true },
  // Premium themes can be viewed by everyone (for upsell) but only SELECTED
  // by users whose User.plan === 'pro'. Enforced in portfolioController.updateMyTheme.
  isPremium: { type: Boolean, default: false },
  // Exactly one theme in the catalog should have isDefault: true at any time.
  // Enforced in the controller (themeController.setDefaultTheme), not via a
  // unique partial index, to keep the write path simple and explicit.
  isDefault: { type: Boolean, default: false },
  // Display order in the switcher / manager UI.
  order: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Theme', themeSchema);
