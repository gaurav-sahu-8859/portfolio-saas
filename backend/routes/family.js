const express = require('express');
const router = express.Router();
const {
  getFamilyGroup, getMyFamilyGroup, getFamilyUsage,
  inviteMember, removeMember, grantPremium, revokePremium,
} = require('../controllers/familyController');
const { protect, familyAdmin } = require('../middleware/authMiddleware');

// `familyAdmin` middleware lets family_admin, admin, and super_admin through
// the gate — i.e. "is this account family-management-capable at all".
// Ownership of the SPECIFIC group in :groupId is then checked inline in the
// controller (assertCanManageGroup), since that depends on the resource:
// a family_admin only passes for their OWN group; admin/super_admin pass
// for any group, per "ADMIN: full platform management access".
router.use(protect, familyAdmin);

// Convenience: a family_admin's own group without needing its ID first.
router.get('/groups/my', getMyFamilyGroup);

router.get('/groups/:groupId', getFamilyGroup);
router.get('/groups/:groupId/usage', getFamilyUsage);
router.post('/groups/:groupId/members', inviteMember);
router.delete('/groups/:groupId/members/:memberId', removeMember);
router.put('/groups/:groupId/members/:memberId/grant-premium', grantPremium);
router.put('/groups/:groupId/members/:memberId/revoke-premium', revokePremium);

module.exports = router;
