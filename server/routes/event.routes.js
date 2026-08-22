const express = require('express');

const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');



const {
  getEvents,
  getEventById,
  getAllEventsAdmin,
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
//
// We don't require auth here so events can still be viewed.
// If the user has a valid token, the controller can attach
// registered: true/false.
router.get('/', getEvents);


// =====================================================
// AUTHENTICATED USER
// =====================================================

// IMPORTANT:
// This MUST come before /:id.
router.get(
  '/my-registrations',
  authMiddleware,
  getMyRegistrations
);


// Register permanently for an event.
router.post(
  '/:id/register',
  authMiddleware,
  registerForEvent
);


// Cancellation endpoint kept for future use.
router.delete(
  '/:id/register',
  authMiddleware,
  cancelRegistration
);


// =====================================================
// SINGLE EVENT
// =====================================================

router.get(
  '/:id',
  getEventById
);


// =====================================================
// EVENT MANAGEMENT
// =====================================================

router.post(
  '/',
  authMiddleware,
  roleMiddleware('teacher', 'staff', 'admin'),
  createEvent
);

router.patch(
  '/:id',
  authMiddleware,
  roleMiddleware('teacher', 'staff', 'admin'),
  updateEvent
);

router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware('staff', 'admin'),
  deleteEvent
);

// Register permanently for an event.
router.post('/:id/register', authMiddleware, registerForEvent);

// Cancellation endpoint kept for future use.
router.delete('/:id/register', authMiddleware, cancelRegistration);

// ADMIN — all events including drafts. Must stay above '/:id'.
router.get(
  '/admin/all',
  authMiddleware,
  roleMiddleware('admin'),
  getAllEventsAdmin
);

// =====================================================
// SINGLE EVENT
// =====================================================
router.get('/:id', getEventById);


module.exports = router;