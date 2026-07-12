const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const FamilyGroup = require('../models/FamilyGroup');
const { isAdminRole } = require('../utils/entitlements');

/**
 * Every mutating action here is reused by TWO route trees:
 *   - /api/family/groups/...        (family_admin managing THEIR OWN group)
 *   - /api/admin/family-groups/...  (admin/super_admin managing ANY group)
 * The role middleware on each route tree only establishes "is this account
 * family-management-capable at all" — the actual "do you own THIS group"
 * check happens here, inline, because it depends on the resource, not just
 * the role. This mirrors how the rest of this codebase scopes ownership
 * (see crudController.js, portfolioController.updateMyTheme).
 */
const assertCanManageGroup = (group, actingUser, res) => {
  const isOwner = group.owner.toString() === actingUser._id.toString();
  if (!isOwner && !isAdminRole(actingUser)) {
    // errorMiddleware.js reads res.statusCode (set via res.status()), not a
    // custom error property — so the status has to be set here, on `res`,
    // before throwing, matching every other guard clause in this codebase.
    res.status(403);
    throw new Error('You do not manage this family group');
  }
};

const populateGroup = (query) => query
  .populate('owner', 'name email username')
  .populate('members.user', 'name email username plan isActive');

/* ───────────────────────── ADMIN / SUPER_ADMIN OVERSIGHT ───────────────────────── */

// @desc    Create a family group and promote the target user to family_admin
// @route   POST /api/admin/family-groups
// @access  Admin (admin or super_admin — route-level guard)
const createFamilyGroup = asyncHandler(async (req, res) => {
  const { name, ownerEmail, maxMembers } = req.body;
  if (!name || !ownerEmail) { res.status(400); throw new Error('name and ownerEmail are required'); }

  const owner = await User.findOne({ email: ownerEmail.toLowerCase().trim() });
  if (!owner) { res.status(404); throw new Error('No user found with that email — they must register first'); }

  if (isAdminRole(owner)) {
    res.status(400);
    throw new Error('This user is already admin-tier — admins do not need family_admin status');
  }
  if (owner.role === 'family_admin') {
    res.status(400);
    throw new Error('This user already owns a family group');
  }

  const existingGroup = await FamilyGroup.findOne({ owner: owner._id });
  if (existingGroup) { res.status(400); throw new Error('This user already owns a family group'); }

  const group = await FamilyGroup.create({
    name,
    owner: owner._id,
    maxMembers: maxMembers || 5,
  });

  owner.role = 'family_admin';
  await owner.save({ validateBeforeSave: false });

  const populated = await populateGroup(FamilyGroup.findById(group._id));
  res.status(201).json(populated);
});

// @desc    List every family group on the platform
// @route   GET /api/admin/family-groups
// @access  Admin
const listFamilyGroups = asyncHandler(async (req, res) => {
  const groups = await populateGroup(FamilyGroup.find({}).sort({ createdAt: -1 }));
  res.json({ groups });
});

/* ───────────────────────── SHARED (family_admin's own group, or admin/super_admin on any group) ───────────────────────── */

// @desc    Get a family group's full detail + member list
// @route   GET /api/family/groups/:groupId
// @access  Private (ownership-or-admin checked inline)
const getFamilyGroup = asyncHandler(async (req, res) => {
  const group = await populateGroup(FamilyGroup.findById(req.params.groupId));
  if (!group) { res.status(404); throw new Error('Family group not found'); }
  assertCanManageGroup(group, req.user, res);
  res.json(group);
});

// @desc    Convenience route — resolves "my own group" for a family_admin
//          without them needing to know their own group's ID first.
// @route   GET /api/family/groups/my
// @access  Private (family_admin only — route-level guard)
const getMyFamilyGroup = asyncHandler(async (req, res) => {
  const group = await populateGroup(FamilyGroup.findOne({ owner: req.user._id }));
  if (!group) { res.status(404); throw new Error('You do not own a family group'); }
  res.json(group);
});

// @desc    Usage view — member list with their entitlement status
// @route   GET /api/family/groups/:groupId/usage
// @access  Private (ownership-or-admin checked inline)
const getFamilyUsage = asyncHandler(async (req, res) => {
  const group = await populateGroup(FamilyGroup.findById(req.params.groupId));
  if (!group) { res.status(404); throw new Error('Family group not found'); }
  assertCanManageGroup(group, req.user, res);

  const members = group.members.map(m => ({
    user: m.user,
    addedAt: m.addedAt,
    isPremiumGranted: m.isPremiumGranted,
    grantedAt: m.grantedAt,
  }));

  res.json({
    groupId: group._id,
    name: group.name,
    maxMembers: group.maxMembers,
    memberCount: members.length,
    premiumGrantedCount: members.filter(m => m.isPremiumGranted).length,
    members,
  });
});

// @desc    Invite an EXISTING registered user into the group by email
// @route   POST /api/family/groups/:groupId/members
// @access  Private (ownership-or-admin checked inline)
const inviteMember = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) { res.status(400); throw new Error('email is required'); }

  const group = await FamilyGroup.findById(req.params.groupId);
  if (!group) { res.status(404); throw new Error('Family group not found'); }
  assertCanManageGroup(group, req.user, res);

  const target = await User.findOne({ email: email.toLowerCase().trim() });
  if (!target) { res.status(404); throw new Error('No user found with that email — they must register first'); }

  if (isAdminRole(target) || target.role === 'family_admin') {
    res.status(400);
    throw new Error('Admin-tier accounts cannot be added as family members');
  }
  if (group.members.some(m => m.user.toString() === target._id.toString())) {
    res.status(400); throw new Error('This user is already a member of the group');
  }
  if (group.members.length >= group.maxMembers) {
    res.status(400); throw new Error(`This group is at its limit of ${group.maxMembers} members`);
  }
  // A user can only belong to one family at a time, to keep entitlement
  // resolution (User.familyAccess) unambiguous.
  if (target.familyAccess?.groupId) {
    res.status(400); throw new Error('This user already belongs to a different family group');
  }

  group.members.push({ user: target._id });
  await group.save();

  const populated = await populateGroup(FamilyGroup.findById(group._id));
  res.status(201).json(populated);
});

// @desc    Remove a member from the group (also revokes any premium grant)
// @route   DELETE /api/family/groups/:groupId/members/:memberId
// @access  Private (ownership-or-admin checked inline)
const removeMember = asyncHandler(async (req, res) => {
  const group = await FamilyGroup.findById(req.params.groupId);
  if (!group) { res.status(404); throw new Error('Family group not found'); }
  assertCanManageGroup(group, req.user, res);

  const before = group.members.length;
  group.members = group.members.filter(m => m.user.toString() !== req.params.memberId);
  if (group.members.length === before) { res.status(404); throw new Error('That member is not in this group'); }
  await group.save();

  // Clear the denormalized entitlement cache if it pointed at this group —
  // removal always revokes access, never leaves a dangling grant.
  await User.updateOne(
    { _id: req.params.memberId, 'familyAccess.groupId': group._id },
    { $set: { familyAccess: { groupId: null, grantedBy: null, isPremiumGranted: false, grantedAt: null } } }
  );

  res.json({ message: 'Member removed from family group' });
});

// @desc    Grant premium access to a member within the family admin's own group
// @route   PUT /api/family/groups/:groupId/members/:memberId/grant-premium
// @access  Private (ownership-or-admin checked inline)
const grantPremium = asyncHandler(async (req, res) => {
  const group = await FamilyGroup.findById(req.params.groupId);
  if (!group) { res.status(404); throw new Error('Family group not found'); }
  assertCanManageGroup(group, req.user, res);

  const member = group.members.find(m => m.user.toString() === req.params.memberId);
  if (!member) { res.status(404); throw new Error('That member is not in this group'); }

  member.isPremiumGranted = true;
  member.grantedAt = new Date();
  await group.save();

  // Denormalize onto the user for O(1) reads in the theme premium gate.
  await User.findByIdAndUpdate(req.params.memberId, {
    $set: {
      familyAccess: {
        groupId: group._id,
        grantedBy: req.user._id,
        isPremiumGranted: true,
        grantedAt: member.grantedAt,
      },
    },
  });

  res.json({ message: 'Premium access granted', memberId: req.params.memberId });
});

// @desc    Revoke premium access from a member
// @route   PUT /api/family/groups/:groupId/members/:memberId/revoke-premium
// @access  Private (ownership-or-admin checked inline)
const revokePremium = asyncHandler(async (req, res) => {
  const group = await FamilyGroup.findById(req.params.groupId);
  if (!group) { res.status(404); throw new Error('Family group not found'); }
  assertCanManageGroup(group, req.user, res);

  const member = group.members.find(m => m.user.toString() === req.params.memberId);
  if (!member) { res.status(404); throw new Error('That member is not in this group'); }

  member.isPremiumGranted = false;
  await group.save();

  await User.findByIdAndUpdate(req.params.memberId, {
    $set: { 'familyAccess.isPremiumGranted': false },
  });

  res.json({ message: 'Premium access revoked', memberId: req.params.memberId });
});

module.exports = {
  createFamilyGroup,
  listFamilyGroups,
  getFamilyGroup,
  getMyFamilyGroup,
  getFamilyUsage,
  inviteMember,
  removeMember,
  grantPremium,
  revokePremium,
};
