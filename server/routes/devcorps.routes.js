const express = require('express');

const authMiddleware = require('../middleware/authMiddleware');
const devcorpsMiddleware = require('../middleware/devcorpsMiddleware');
const { uploadDocument } = require('../middleware/upload');
const devcorpsDocumentationController = require('../controllers/devcorpsDocumentationController');
const communityConstitutionController = require('../controllers/communityConstitutionController');

const router = express.Router();

// ── Documentation content served only to members of the DevCorps
//    Community Portal. Protected by authMiddleware + devcorpsMiddleware,
//    so the backend is the authority on who may access this portal — the
//    frontend is only a convenience layer, never the security boundary. ──
const DEV_CORPS_DOCUMENTATION = [
  {
    id: 'overview',
    title: 'About DevCorps',
    description:
      'BIC Dev Corps is the software and technology community of Biratnagar International College. We build, document, and ship campus solutions — connecting students, clubs, and organizers through hands-on projects and events.',
    points: [
      'Student-run community focused on software engineering & innovation.',
      'Organizes hackathons, workshops, and campus-wide tech events.',
      'Collaborates with clubs and departments on real campus projects.',
    ],
  },
  {
    id: 'projects',
    title: 'Project & Submission Guidelines',
    description:
      'Every DevCorps project follows a clear lifecycle. Use the documentation below to prepare, review, and submit your project deliverables.',
    points: [
      'Start with a project proposal approved by the community coordinators.',
      'Maintain your code in a shared repository with clear commit history.',
      'Submit the final phase documentation (report, demo video, and presentation) before the deadline.',
      'All submissions are reviewed by the DevCorps review panel before showcase.',
    ],
  },
  {
    id: 'events',
    title: 'Event Policies',
    description:
      'DevCorps runs both college and community events. Event registration is open to the whole campus while seats last.',
    points: [
      'Check the Events tab for upcoming college and community events.',
      'High-capacity events are first-come, first-served through registration.',
      'Organizers publish venue, date, and time for every event.',
    ],
  },
  {
    id: 'contact',
    title: 'Coordinators & Contact',
    description:
      'Reach out through the campus community channel for project guidance, event support, or collaboration requests.',
    points: [
      'Use the Chat tab to connect with coordinators and members.',
      'Official announcements are posted on the portal dashboard.',
      'Campus help is one tap away from any issue you face at BIC.',
    ],
  },
];

// GET /api/devcorps/portal
// Returns the identity of the DevCorps portal plus the documentation that
// only DevCorps members may read. Non-members always receive 401/403.
router.get('/portal', authMiddleware, devcorpsMiddleware, (req, res) => {
  res.status(200).json({
    portal: devcorpsMiddleware.DEV_CORPS_PORTAL_ID,
    portalName: 'DevCorps Community Portal',
    account: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
    },
    documentation: DEV_CORPS_DOCUMENTATION,
  });
});

// ── Community Documentation boards + per-community file storage ────────────
// The DevCorps admin can read every community's records. A community member
// (the five member communities) is scoped to their OWN community only —
// matched by the account's specific community name. The member community
// itself can manage its own cards and sections and its workshop count; the
// checkboxes and points (the DevCorps marking/point system) and file
// management stay admin-only.

// Overall summary for DevCorps to track all five communities. Registered
// BEFORE the :communityId routes so "summary" is never parsed as an id.
router.get(
  '/documentation/summary',
  authMiddleware,
  devcorpsMiddleware.devcorpsAdminMiddleware,
  devcorpsDocumentationController.getSummary
);

// Checklist board
router.get(
  '/documentation/:communityId',
  authMiddleware,
  devcorpsMiddleware.devcorpsMemberScope,
  devcorpsDocumentationController.getBoard
);
router.post(
  '/documentation/:communityId/events',
  authMiddleware,
  devcorpsMiddleware.devcorpsMemberScope,
  devcorpsDocumentationController.addEvent
);
router.delete(
  '/documentation/:communityId/events/:order',
  authMiddleware,
  devcorpsMiddleware.devcorpsMemberScope,
  devcorpsDocumentationController.removeEvent
);
router.patch(
  '/documentation/:communityId/events/:order',
  authMiddleware,
  devcorpsMiddleware.devcorpsMemberScope,
  devcorpsDocumentationController.renameEvent
);
router.patch(
  '/documentation/:communityId/events/:order/tasks/:key',
  authMiddleware,
  devcorpsMiddleware.devcorpsMemberScope,
  devcorpsDocumentationController.updateTask
);
router.patch(
  '/documentation/:communityId/workshops',
  authMiddleware,
  devcorpsMiddleware.devcorpsMemberScope,
  devcorpsDocumentationController.updateWorkshops
);

// File storage (per-community, only reachable through this portal)
router.get(
  '/documentation/:communityId/files',
  authMiddleware,
  devcorpsMiddleware.devcorpsMemberScope,
  devcorpsDocumentationController.listFiles
);
router.post(
  '/documentation/:communityId/files',
  authMiddleware,
  devcorpsMiddleware.devcorpsAdminMiddleware,
  uploadDocument.single('file'),
  devcorpsDocumentationController.uploadFile
);
router.patch(
  '/documentation/files/:fileId',
  authMiddleware,
  devcorpsMiddleware.devcorpsAdminMiddleware,
  devcorpsDocumentationController.updateFilePoints
);
router.delete(
  '/documentation/files/:fileId',
  authMiddleware,
  devcorpsMiddleware.devcorpsAdminMiddleware,
  devcorpsDocumentationController.deleteFile
);

// ── Community Constitutions ────────────────────────────────────────────────
// One constitution per community (unique on communityId). Uploading again
// replaces the previous copy; deletion removes it entirely. Scoping is
// enforced with devcorpsMemberScope: the DevCorps portal admin can manage any
// community, while each of the five member accounts can only touch its own.
// Members (approved users) read via the community-portal route instead.

// Every community's constitution — DevCorps admin overview.
router.get(
  '/constitutions',
  authMiddleware,
  devcorpsMiddleware.devcorpsAdminMiddleware,
  communityConstitutionController.listConstitutions
);

// Read the community's own constitution (community account / portal admin).
router.get(
  '/constitution/:communityId',
  authMiddleware,
  devcorpsMiddleware.devcorpsMemberScope,
  communityConstitutionController.getConstitution
);

// Upload OR replace (multipart, field: 'file').
router.put(
  '/constitution/:communityId',
  authMiddleware,
  devcorpsMiddleware.devcorpsMemberScope,
  uploadDocument.single('file'),
  communityConstitutionController.upsertConstitution
);

// Delete the community's constitution.
router.delete(
  '/constitution/:communityId',
  authMiddleware,
  devcorpsMiddleware.devcorpsMemberScope,
  communityConstitutionController.deleteConstitution
);

module.exports = router;