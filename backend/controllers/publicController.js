const asyncHandler = require('express-async-handler');
const Portfolio = require('../models/Portfolio');
const Project = require('../models/Project');
const { Skill, Experience, Education, Certificate } = require('../models/SubModels');
const User = require('../models/User');
const streamRemoteFile = require('../utils/streamRemoteFile');
// const resolveResumeUrl = require('../utils/resolveResumeUrl');

// @desc    Get public portfolio by USERNAME
// @route   GET /api/public/:username
const getPublicPortfolio = asyncHandler(async (req, res) => {
  // Find user by username
  const user = await User.findOne({ username: req.params.username.toLowerCase(), isActive: true });
  if (!user) { res.status(404); throw new Error('Portfolio not found'); }

  const portfolio = await Portfolio.findOne({ user: user._id, isPublished: true });
  if (!portfolio) { res.status(404); throw new Error('Portfolio not published'); }

  // Increment views
  portfolio.views += 1;
  await portfolio.save({ validateBeforeSave: false });

  const [projects, skills, experience, education, certificates] = await Promise.all([
    Project.find({ user: user._id }).sort({ order: 1, createdAt: -1 }),
    Skill.find({ user: user._id }).sort({ order: 1 }),
    Experience.find({ user: user._id }).sort({ order: 1, startDate: -1 }),
    Education.find({ user: user._id }).sort({ order: 1, startYear: -1 }),
    Certificate.find({ user: user._id }).sort({ order: 1, issueDate: -1 })
  ]);

  res.json({ portfolio, user: { name: user.name, username: user.username }, projects, skills, experience, education, certificates });
});

// @desc    Search published portfolios
// @route   GET /api/public/search
const searchPortfolios = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 12 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Find matching users first
  const userQuery = q
    ? { $or: [{ name: { $regex: q, $options: 'i' } }, { username: { $regex: q, $options: 'i' } }], isActive: true }
    : { isActive: true };

  const matchingUsers = await User.find(userQuery).select('_id name username');
  const userIds = matchingUsers.map(u => u._id);

  const portfolioQuery = { isPublished: true, ...(q ? { user: { $in: userIds } } : {}) };

  const [portfolios, total] = await Promise.all([
    Portfolio.find(portfolioQuery)
      .populate('user', 'name username')
      .select('fullName title profilePicture bio views updatedAt theme accentColor')
      .skip(skip).limit(parseInt(limit)).sort({ views: -1, updatedAt: -1 }),
    Portfolio.countDocuments(portfolioQuery)
  ]);

  res.json({ portfolios, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
});

// @desc    Get owner portfolio (for / route)
// @route   GET /api/public/owner
const getOwnerPortfolio = asyncHandler(async (req, res) => {
  const ownerUsername = process.env.OWNER_USERNAME;
  if (!ownerUsername) { res.status(404); throw new Error('Owner not configured'); }

  const user = await User.findOne({ username: ownerUsername.toLowerCase() });
  if (!user) { res.status(404); throw new Error('Owner portfolio not found'); }

  const portfolio = await Portfolio.findOne({ user: user._id });
  if (!portfolio) { res.status(404); throw new Error('Owner portfolio not found'); }

  // Return even if unpublished (for preview)
  const [projects, skills, experience, education, certificates] = await Promise.all([
    Project.find({ user: user._id }).sort({ order: 1, createdAt: -1 }),
    Skill.find({ user: user._id }).sort({ order: 1 }),
    Experience.find({ user: user._id }).sort({ order: 1, startDate: -1 }),
    Education.find({ user: user._id }).sort({ order: 1, startYear: -1 }),
    Certificate.find({ user: user._id }).sort({ order: 1, issueDate: -1 })
  ]);

  res.json({ portfolio, user: { name: user.name, username: user.username }, projects, skills, experience, education, certificates });
});

// @desc    Stream a published portfolio's resume by username — public,
//          no auth, so every theme's resume CTA can use a plain <a href>.
//          Only ever fetches the URL stored on THAT user's own portfolio
//          document, never anything client-supplied — that's what keeps
//          this from being an open proxy.
// @route   GET /api/public/:username/resume
// @access  Public
const viewResumeByUsername = asyncHandler(async (req, res) => {
  const user = await User.findOne({ username: req.params.username.toLowerCase(), isActive: true });
  if (!user) { res.status(404); throw new Error('Portfolio not found'); }

  const portfolio = await Portfolio.findOne({ user: user._id, isPublished: true });
  // const resumeUrl = resolveResumeUrl(portfolio);
  // if (!resumeUrl) { res.status(404); throw new Error('No resume available'); }
  if (!portfolio?.resumeUrl) { res.status(404); throw new Error('No resume available'); }

  // await streamRemoteFile(res, resumeUrl, { filename: `${user.username}-resume.pdf` });
  await streamRemoteFile(res, portfolio.resumeUrl, { filename: `${user.username}-resume.pdf` });

});

// @desc    Stream the OWNER's resume — mirrors getOwnerPortfolio (no
//          isPublished check, since "/" always shows the owner's own
//          content, published or not, for their own preview).
// @route   GET /api/public/owner/resume
// @access  Public
const viewOwnerResume = asyncHandler(async (req, res) => {
  const ownerUsername = process.env.OWNER_USERNAME;
  if (!ownerUsername) { res.status(404); throw new Error('Owner not configured'); }

  const user = await User.findOne({ username: ownerUsername.toLowerCase() });
  if (!user) { res.status(404); throw new Error('Owner not found'); }

  const portfolio = await Portfolio.findOne({ user: user._id });
  if (!portfolio?.resumeUrl) { res.status(404); throw new Error('No resume available'); }
  // const resumeUrl = resolveResumeUrl(portfolio);
  // if (!resumeUrl) { res.status(404); throw new Error('No resume available'); }

  // await streamRemoteFile(res, resumeUrl, { filename: `${user.username}-resume.pdf` });
  await streamRemoteFile(res, portfolio.resumeUrl, { filename: `${user.username}-resume.pdf` });

});

module.exports = {
  getPublicPortfolio, searchPortfolios, getOwnerPortfolio,
  viewResumeByUsername, viewOwnerResume,
};
