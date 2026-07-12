const asyncHandler = require('express-async-handler');
const Theme = require('../models/Theme');
const Portfolio = require('../models/Portfolio');
const IMPLEMENTED_THEMES = require('../config/implementedThemeKeys');

const IMPLEMENTED_KEYS = IMPLEMENTED_THEMES.map(t => t.key);

/* ───────────────────────── USER-FACING (any authenticated user) ───────────────────────── */

// @desc    Get themes available for users to pick from (admin-enabled only)
// @route   GET /api/themes
// @access  Private (protect)
const getEnabledThemes = asyncHandler(async (req, res) => {
  const themes = await Theme.find({ isEnabled: true }).sort({ order: 1, createdAt: 1 });
  res.json(themes);
});

/* ───────────────────────── ADMIN-ONLY (protect + admin) ───────────────────────── */

// @desc    Get full catalog (enabled + disabled) plus usage counts, for the admin manager UI
// @route   GET /api/admin/themes
// @access  Admin
const getAllThemes = asyncHandler(async (req, res) => {
  const themes = await Theme.find({}).sort({ order: 1, createdAt: 1 });

  const counts = await Portfolio.aggregate([
    { $group: { _id: '$theme', count: { $sum: 1 } } }
  ]);
  const countMap = counts.reduce((acc, c) => { acc[c._id] = c.count; return acc; }, {});

  const withCounts = themes.map(t => ({ ...t.toObject(), usageCount: countMap[t.key] || 0 }));
  const cataloguedKeys = themes.map(t => t.key);
  const availableToAdd = IMPLEMENTED_THEMES.filter(t => !cataloguedKeys.includes(t.key));

  res.json({ themes: withCounts, availableToAdd });
});

// @desc    Add a theme to the live catalog
// @route   POST /api/admin/themes
// @access  Admin
const createTheme = asyncHandler(async (req, res) => {
  const { key, name, description, previewAccent, order, isPremium } = req.body;

  if (!key || !name) { res.status(400); throw new Error('key and name are required'); }

  const cleanKey = key.toLowerCase().trim();
  if (!IMPLEMENTED_KEYS.includes(cleanKey)) {
    res.status(400);
    throw new Error('This theme key has no matching frontend component — choose from the implemented list');
  }

  const exists = await Theme.findOne({ key: cleanKey });
  if (exists) { res.status(400); throw new Error('This theme is already in the catalog'); }

  const isFirstEver = (await Theme.countDocuments({})) === 0;

  const theme = await Theme.create({
    key: cleanKey,
    name,
    description: description || '',
    previewAccent: previewAccent || '#6366f1',
    order: order ?? 0,
    isPremium: !!isPremium,
    isDefault: isFirstEver, // the very first catalog entry is auto-defaulted so the platform always has one
  });

  res.status(201).json(theme);
});

// @desc    Update theme metadata / enabled state
// @route   PUT /api/admin/themes/:id
// @access  Admin
const updateTheme = asyncHandler(async (req, res) => {
  const allowed = ['name', 'description', 'previewAccent', 'isEnabled', 'isPremium', 'order'];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const theme = await Theme.findById(req.params.id);
  if (!theme) { res.status(404); throw new Error('Theme not found'); }

  if (updates.isEnabled === false && theme.isDefault) {
    res.status(400);
    throw new Error('Cannot disable the default theme — set a different default first');
  }
  if (updates.isPremium === true && theme.isDefault) {
    res.status(400);
    throw new Error('The default theme must stay free — new signups on the free plan need to be able to load it');
  }

  Object.assign(theme, updates);
  await theme.save();
  res.json(theme);
});

// @desc    Remove a theme from the catalog
// @route   DELETE /api/admin/themes/:id
// @access  Admin
const deleteTheme = asyncHandler(async (req, res) => {
  const theme = await Theme.findById(req.params.id);
  if (!theme) { res.status(404); throw new Error('Theme not found'); }
  if (theme.isDefault) {
    res.status(400);
    throw new Error('Cannot delete the default theme — set a different default first');
  }

  // Users who already have this theme keep it (their saved preference is untouched).
  // It simply disappears from the catalog so it can no longer be newly selected.
  const usageCount = await Portfolio.countDocuments({ theme: theme.key });
  await theme.deleteOne();

  res.json({ message: 'Theme removed from catalog', affectedExistingUsers: usageCount });
});

// @desc    Mark a theme as the platform default (new users get this automatically)
// @route   PUT /api/admin/themes/:id/set-default
// @access  Admin
const setDefaultTheme = asyncHandler(async (req, res) => {
  const theme = await Theme.findById(req.params.id);
  if (!theme) { res.status(404); throw new Error('Theme not found'); }
  if (!theme.isEnabled) { res.status(400); throw new Error('Cannot default to a disabled theme — enable it first'); }
  if (theme.isPremium) {
    res.status(400);
    throw new Error('Cannot default to a premium theme — new free-plan signups would be unable to load it');
  }

  // Two-step swap: unset the old default, then set the new one.
  // Scoped to this single collection so it's safe without a transaction at this scale.
  await Theme.updateMany({ isDefault: true }, { $set: { isDefault: false } });
  theme.isDefault = true;
  await theme.save();

  res.json(theme);
});

module.exports = {
  getEnabledThemes,
  getAllThemes,
  createTheme,
  updateTheme,
  deleteTheme,
  setDefaultTheme,
};
