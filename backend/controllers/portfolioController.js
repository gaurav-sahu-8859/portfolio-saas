const asyncHandler = require('express-async-handler');
const Portfolio = require('../models/Portfolio');
const streamRemoteFile = require('../utils/streamRemoteFile');
// const resolveResumeUrl = require('../utils/resolveResumeUrl');

const getMyPortfolio = asyncHandler(async (req, res) => {
  let portfolio = await Portfolio.findOne({ user: req.user._id });
  if (!portfolio) portfolio = await Portfolio.create({ user: req.user._id, fullName: req.user.name });
  res.json(portfolio);
});

const updatePortfolio = asyncHandler(async (req, res) => {
  // NOTE: 'theme' is intentionally NOT in this list. Changing the theme
  // always goes through updateMyTheme below, which validates the requested
  // key against the live, admin-curated Theme catalog before saving.
  // Allowing it here would let a user (or a crafted request) set any string
  // as their theme, bypassing admin control entirely.
  const allowed = [
    'fullName', 'tagline', 'title', 'bio', 'profilePicture', 'coverImage', 'resumeUrl',
    //  'resumePublicId',
    'contact', 'socialLinks', 'accentColor', 'seoTitle', 'seoDescription',
    'isPublished', 'sections'
  ];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const portfolio = await Portfolio.findOneAndUpdate(
    { user: req.user._id },
    { $set: updates },
    { new: true, runValidators: true, upsert: true }
  );
  res.json(portfolio);
});

// @desc    Change ONLY the current user's theme — the one mutation path for theme
// @route   PUT /api/portfolio/theme
// @access  Private
const updateMyTheme = asyncHandler(async (req, res) => {
  const { theme } = req.body;
  if (!theme) { res.status(400); throw new Error('theme is required'); }

  const Theme = require('../models/Theme');
  const { isPremiumEntitled } = require('../utils/entitlements');

  const catalogEntry = await Theme.findOne({ key: theme.toLowerCase().trim(), isEnabled: true });
  if (!catalogEntry) {
    res.status(400);
    throw new Error('That theme is not currently available — choose one of the enabled themes');
  }

  // PREMIUM GATE: this is the actual security boundary, not the frontend
  // lock icon. isPremiumEntitled() is the single source of truth — it
  // returns true for admin/super_admin (never blocked by billing), for
  // plan === 'pro' (paid via Stripe), and for an active family grant.
  // A free user with none of those hitting this endpoint directly — via
  // curl, a modified frontend build, anything — is rejected here with 402,
  // regardless of UI state.
  if (catalogEntry.isPremium && !isPremiumEntitled(req.user)) {
    res.status(402);
    throw new Error('This is a Pro theme — upgrade your plan to use it');
  }

  // Scoped strictly to req.user._id. This is what guarantees rule 7:
  // a theme change here can NEVER touch another user's portfolio document.
  const portfolio = await Portfolio.findOneAndUpdate(
    { user: req.user._id },
    { $set: { theme: catalogEntry.key } },
    { new: true, upsert: true }
  );
  res.json(portfolio);
});

const togglePublish = asyncHandler(async (req, res) => {
  const portfolio = await Portfolio.findOne({ user: req.user._id });
  if (!portfolio) { res.status(404); throw new Error('Portfolio not found'); }
  portfolio.isPublished = !portfolio.isPublished;
  await portfolio.save();
  res.json({ isPublished: portfolio.isPublished, message: portfolio.isPublished ? 'Portfolio published!' : 'Portfolio unpublished' });
});

const getStats = asyncHandler(async (req, res) => {
  const Project = require('../models/Project');
  const { Skill, Experience, Education, Certificate } = require('../models/SubModels');
  const User = require('../models/User');
  const { isPremiumEntitled, bypassesBilling } = require('../utils/entitlements');

  const user = await User.findById(req.user._id).select('username plan role familyAccess');
  const [portfolio, projects, skills, experience, education, certificates] = await Promise.all([
    Portfolio.findOne({ user: req.user._id }),
    Project.countDocuments({ user: req.user._id }),
    Skill.countDocuments({ user: req.user._id }),
    Experience.countDocuments({ user: req.user._id }),
    Education.countDocuments({ user: req.user._id }),
    Certificate.countDocuments({ user: req.user._id })
  ]);

  res.json({
    views: portfolio?.views || 0, projects, skills, experience,
    education, certificates,
    isPublished: portfolio?.isPublished || false,
    username: user?.username || '',
    theme: portfolio?.theme || 'modern-saas',
    plan: user?.plan || 'free',
    role: user?.role || 'user',
    entitlement: isPremiumEntitled(user),
    bypassesBilling: bypassesBilling(user),
  });
});

// @desc    Stream the current user's own resume with guaranteed-correct
//          headers — used by the dashboard's "View Resume" link, which
//          needs auth (to know whose resume) so it fetches via axios with
//          the Bearer token and opens the result as a blob, rather than a
//          plain <a href> (which can't carry an Authorization header).
// @route   GET /api/portfolio/resume
// @access  Private
const viewMyResume = asyncHandler(async (req, res) => {
  const portfolio = await Portfolio.findOne({ user: req.user._id });
  if (!portfolio?.resumeUrl) { res.status(404); throw new Error('No resume uploaded yet'); }
  await streamRemoteFile(res, portfolio.resumeUrl);
  // const resumeUrl = resolveResumeUrl(portfolio);
  // if (!resumeUrl) { res.status(404); throw new Error('No resume uploaded yet'); }
  // await streamRemoteFile(res, resumeUrl);
});

module.exports = { getMyPortfolio, updatePortfolio, updateMyTheme, togglePublish, getStats, viewMyResume };
