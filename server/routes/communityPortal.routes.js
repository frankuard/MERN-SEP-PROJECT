const express = require('express');

const authMiddleware = require('../middleware/authMiddleware');
const devcorpsMiddleware = require('../middleware/devcorpsMiddleware');
const communityPortalController = require('../controllers/communityPortalController');
const communityConstitutionController = require('../controllers/communityConstitutionController');

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

// ── Real-time Total Members (DevCorps Communities cards) ───────────────────
// Public aggregate read for any authenticated user; static segment registered
// before the ":communityId" routes below.
router.get(
  '/counts',
  authMiddleware,
  communityPortalController.getCommunityMemberCounts
);

// ── About Community profiles (single source of truth) ──────────────────────
// GET is the shared read for both the Manage Users About tab and the DevCorps
// Communities Portal dropdowns. PUT edits the community's About profile and
// feeds every consumer automatically — DEV CORPS ADMIN ONLY. The five member
// community accounts may read their About but never edit their community.
router.get(
  '/communities',
  authMiddleware,
  communityPortalController.getCommunityProfiles
);
router.put(
  '/communities/:communityId',
  authMiddleware,
  devcorpsMiddleware.devcorpsAdminMiddleware,
  communityPortalController.updateCommunityProfile
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

// ── Constitution (read-only for members) ─────────────────────────────────────
// The community's approved members can read its constitution, but never
// edit/delete it — membership is verified inside the controller. The owning
// community account and the portal admin are allowed too (they manage via
// /api/devcorps/constitution/:communityId).
router.get(
  '/:communityId/constitution',
  authMiddleware,
  communityConstitutionController.getMemberConstitution
);

module.exports = router;