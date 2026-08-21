const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
  getTimetable,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
} = require('../controllers/timetableController');

// =====================================================
// PUBLIC / AUTHENTICATED TIMETABLE VIEW
// =====================================================
router.get('/', getTimetable);
router.get('/:id', getClassById);

// =====================================================
// ADMIN / STAFF TIMETABLE MANAGEMENT (CRUD)
// =====================================================
router.post(
  '/',
  authMiddleware,
  roleMiddleware('admin', 'staff'),
  createClass
);

router.put(
  '/:id',
  authMiddleware,
  roleMiddleware('admin', 'staff'),
  updateClass
);

router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware('admin', 'staff'),
  deleteClass
);

module.exports = router;
