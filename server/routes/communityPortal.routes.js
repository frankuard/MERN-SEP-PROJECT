const express = require('express');

const authMiddleware = require('../middleware/authMiddleware');
const devcorpsMiddleware = require('../middleware/devcorpsMiddleware');
const communityPortalController = require('../controllers/communityPortalController');

const router = express.Router();

// ══════════════════════════════════════════════════════════════════════════
// Community Portal — Manage User (membership requests) + Workshop Release
//
// Static segments ("users", "my", "workshops") MUST be registered before the
// ":communityId" routes below, otherwise Express would parse e.g. "my" as a
// communityId. Backend is always the authority: every community-scoped route
// goes through devcorpsMemberScope, and user-side routes either check the
// membership record directly or require the authenticated user's own record.
// ══════════════════════════════════════════════════════════════════════════

// ── User search + incoming requests (community portal side) ────────────────
router.get(
  '/users/search',
  authMiddleware,
  devcorpsMiddleware.communityMemberMiddleware,
  communityPortalController.searchUsers
);

// ── User side — the signed-in user's own requests / memberships ────────────
router.get(
  '/my/requests',
  authMiddleware,
  communityPortalController.getMyMembershipRequests
);
router.get(
  '/my/memberships',
  authMiddleware,
  communityPortalController.getMyMemberships
);
router.patch(
  '/requests/:membershipId',
  authMiddleware,
  communityPortalController.respondToMembershipRequest
);

// ── Per-community membership management (community member only) ────────────
router.post(
  '/:communityId/memberships',
  authMiddleware,
  devcorpsMiddleware.devcorpsMemberScope,
  communityPortalController.sendMembershipRequest
);
router.get(
  '/:communityId/memberships',
  authMiddleware,
  devcorpsMiddleware.devcorpsMemberScope,
  communityPortalController.getMemberships
);

// ── Workshops ───────────────────────────────────────────────────────────────
// Readable by the community owner, the portal admin, or an approved member
// user (access is checked inside the controller via the membership record).
router.get(
  '/:communityId/workshops',
  authMiddleware,
  communityPortalController.listWorkshops
);

// Release/delete are community-owner (or portal admin) actions.
router.post(
  '/:communityId/workshops',
  authMiddleware,
  devcorpsMiddleware.devcorpsMemberScope,
  communityPortalController.createWorkshop
);
router.delete(
  '/:communityId/workshops/:workshopId',
  authMiddleware,
  devcorpsMiddleware.devcorpsMemberScope,
  communityPortalController.deleteWorkshop
);

module.exports = router;