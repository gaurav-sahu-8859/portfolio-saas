const express = require('express');
const router = express.Router();
const {
  getUsers, getUserById, toggleUserStatus, deleteUser, getOverview, getPortfolios,
  listAdmins, promoteToAdmin, demoteAdmin,
} = require('../controllers/adminController');
const { createFamilyGroup, listFamilyGroups } = require('../controllers/familyController');
const { protect, admin, superAdmin } = require('../middleware/authMiddleware');

// Everything below requires admin-tier (admin OR super_admin).
router.use(protect, admin);

router.get('/overview', getOverview);
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.delete('/users/:id', deleteUser);
router.get('/portfolios', getPortfolios);

// ── Family group oversight — creating a group promotes the target user to
// family_admin, which is a role-elevation action, so it stays under the
// admin-tier gate above (any admin or super_admin can do this) ──────────
router.post('/family-groups', createFamilyGroup);
router.get('/family-groups', listFamilyGroups);

// ── Super-admin-exclusive: creating/removing peer admins ────────────────
// `superAdmin` is chained AFTER the router-level `admin` gate above, so a
// regular admin's valid token passes `admin` but is then rejected here —
// only super_admin gets through both checks.
router.get('/admins', superAdmin, listAdmins);
router.put('/users/:id/promote', superAdmin, promoteToAdmin);
router.put('/users/:id/demote', superAdmin, demoteAdmin);

module.exports = router;
