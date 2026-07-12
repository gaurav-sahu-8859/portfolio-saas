const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const Project = require('../models/Project');
const { Skill, Experience, Education, Certificate } = require('../models/SubModels');
const { isAdminRole } = require('../utils/entitlements');

// @desc    Get all users with pagination
// @route   GET /api/admin/users
// @access  Admin
const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search || '';
  const skip = (page - 1) * limit;

  const query = search
    ? { $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }
    : {};

  const [users, total] = await Promise.all([
    User.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(query)
  ]);

  res.json({ users, total, page, pages: Math.ceil(total / limit) });
});

// @desc    Get user by ID with full portfolio data
// @route   GET /api/admin/users/:id
// @access  Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }

  const portfolio = await Portfolio.findOne({ user: user._id });
  const [projects, skills, experience, education, certificates] = await Promise.all([
    Project.countDocuments({ user: user._id }),
    Skill.countDocuments({ user: user._id }),
    Experience.countDocuments({ user: user._id }),
    Education.countDocuments({ user: user._id }),
    Certificate.countDocuments({ user: user._id })
  ]);

  res.json({ user, portfolio, counts: { projects, skills, experience, education, certificates } });
});

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/toggle-status
// @access  Admin
const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }

  if (user.role === 'super_admin') {
    res.status(403); throw new Error('Super admin accounts cannot be deactivated');
  }
  if (user.role === 'admin' && req.user.role !== 'super_admin') {
    res.status(403); throw new Error('Only a super admin can deactivate an admin account');
  }
  // family_admin and user accounts are manageable by any admin-tier account.

  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });

  res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}`, isActive: user.isActive });
});

// @desc    Delete user and all data
// @route   DELETE /api/admin/users/:id
// @access  Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }

  if (user.role === 'super_admin') {
    res.status(403); throw new Error('Super admin accounts cannot be deleted');
  }
  if (user.role === 'admin' && req.user.role !== 'super_admin') {
    res.status(403); throw new Error('Only a super admin can remove an admin account');
  }

  // If this user owns a family group, surface that rather than silently
  // orphaning it — admin should reassign or explicitly accept the cascade.
  const FamilyGroup = require('../models/FamilyGroup');
  const ownedGroup = await FamilyGroup.findOne({ owner: user._id });

  // Cascade delete
  await Promise.all([
    Portfolio.deleteOne({ user: user._id }),
    Project.deleteMany({ user: user._id }),
    Skill.deleteMany({ user: user._id }),
    Experience.deleteMany({ user: user._id }),
    Education.deleteMany({ user: user._id }),
    Certificate.deleteMany({ user: user._id }),
    ownedGroup ? FamilyGroup.deleteOne({ _id: ownedGroup._id }) : Promise.resolve(),
    User.deleteOne({ _id: user._id })
  ]);

  res.json({
    message: 'User and all data deleted successfully',
    familyGroupDeleted: !!ownedGroup,
  });
});

// @desc    Get admin dashboard overview
// @route   GET /api/admin/overview
// @access  Admin
const getOverview = asyncHandler(async (req, res) => {
  const [
    totalUsers, activeUsers, publishedPortfolios,
    totalProjects, totalSkills,
    recentUsers, adminCount, familyAdminCount,
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'user', isActive: true }),
    Portfolio.countDocuments({ isPublished: true }),
    Project.countDocuments(),
    Skill.countDocuments(),
    User.find({ role: 'user' }).sort({ createdAt: -1 }).limit(5).select('name email createdAt isActive'),
    User.countDocuments({ role: { $in: ['admin', 'super_admin'] } }),
    User.countDocuments({ role: 'family_admin' }),
  ]);

  res.json({
    stats: { totalUsers, activeUsers, publishedPortfolios, totalProjects, totalSkills, adminCount, familyAdminCount },
    recentUsers
  });
});

// @desc    Get all published portfolios
// @route   GET /api/admin/portfolios
// @access  Admin
const getPortfolios = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [portfolios, total] = await Promise.all([
    Portfolio.find({ isPublished: true })
      .populate('user', 'name email username')
      .skip(skip).limit(limit).sort({ updatedAt: -1 }),
    Portfolio.countDocuments({ isPublished: true })
  ]);

  res.json({ portfolios, total, page, pages: Math.ceil(total / limit) });
});

// @desc    List every admin-tier account (admin + super_admin)
// @route   GET /api/admin/admins
// @access  Super Admin only (route-level guard)
const listAdmins = asyncHandler(async (req, res) => {
  const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } })
    .sort({ role: 1, createdAt: 1 })
    .select('name email username role isActive createdAt lastLogin');
  res.json({ admins });
});

// @desc    Promote a user (or family_admin) to a full admin account
// @route   PUT /api/admin/users/:id/promote
// @access  Super Admin only (route-level guard — see routes/admin.js)
const promoteToAdmin = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }

  if (['admin', 'super_admin'].includes(user.role)) {
    res.status(400); throw new Error('This account is already admin-tier');
  }

  // If they were a family_admin, leave their FamilyGroup record alone —
  // it's harmless for an admin to remain listed as a group's `owner`,
  // since admin-tier accounts can already manage any group via the
  // oversight routes regardless of the `owner` field.
  user.role = 'admin';
  await user.save({ validateBeforeSave: false });

  res.json({ message: `${user.name} is now an admin`, user: { _id: user._id, name: user.name, role: user.role } });
});

// @desc    Demote an admin back to a regular user
// @route   PUT /api/admin/users/:id/demote
// @access  Super Admin only (route-level guard)
const demoteAdmin = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }

  if (user.role !== 'admin') {
    res.status(400);
    throw new Error('This route only demotes regular admins — super_admin cannot be changed via the API');
  }

  user.role = 'user';
  await user.save({ validateBeforeSave: false });

  res.json({ message: `${user.name} is no longer an admin`, user: { _id: user._id, name: user.name, role: user.role } });
});

module.exports = {
  getUsers, getUserById, toggleUserStatus, deleteUser, getOverview, getPortfolios,
  listAdmins, promoteToAdmin, demoteAdmin,
};
