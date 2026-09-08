const express = require('express');

const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const optionalAuthMiddleware = require('../middleware/optionalAuthMiddleware'); // ADD THIS
const devcorpsMiddleware = require('../middleware/devcorpsMiddleware');
const { roleOrDevcorpsAdmin } = devcorpsMiddleware;
const {
  getEvents,
  getEventById,
  getAllEventsAdmin,
  getEventRegistrations,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  cancelRegistration,
  getMyRegistrations,
} = require('../controllers/eventController');

// =====================================================
// PUBLIC EVENTS
// =====================================================

// GET /events
// GET /events?type=college
// GET /events?type=community
router.get('/', optionalAuthMiddleware, getEvents);

// =====================================================
// AUTHENTICATED USER
// =====================================================

// IMPORTANT: must come before /:id
router.get('/my-registrations', authMiddleware, getMyRegistrations);

// Register / cancel registration
router.post('/:id/register', authMiddleware, registerForEvent);
router.delete('/:id/register', authMiddleware, cancelRegistration);

// =====================================================
// ADMIN — must stay above the generic '/:id' route below
// =====================================================

// Admin list — also accessible to the DevCorps portal admin (who moderates
// all events, including those organized by other communities). Deletes,
// edits, and creates below follow the same rule: the standard campus roles
// keep their exact existing access, and DevCorps admin is let in alongside.
router.get('/admin/all', authMiddleware, roleOrDevcorpsAdmin('admin'), getAllEventsAdmin);
router.get('/:id/registrations', authMiddleware, roleMiddleware('admin'), getEventRegistrations);

router.post('/', authMiddleware, roleOrDevcorpsAdmin('teacher', 'staff', 'admin'), createEvent);
router.patch('/:id', authMiddleware, roleOrDevcorpsAdmin('teacher', 'staff', 'admin'), updateEvent);
router.delete('/:id', authMiddleware, roleOrDevcorpsAdmin('staff', 'admin'), deleteEvent);

// =====================================================
// SINGLE EVENT (public, must come after the admin/specific routes above)
// =====================================================

router.get('/:id', optionalAuthMiddleware, getEventById);

module.exports = router;