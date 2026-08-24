const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
  getTimetable,
  getScheduleChanges,
  getTimetableAdmin,
  createPeriod,
  updatePeriod,
  deletePeriod,
  getScheduleChangesAdmin,
  createScheduleChange,
  updateScheduleChange,
  deleteScheduleChange,
} = require('../controllers/timetableController');

const allRoles = roleMiddleware('student', 'teacher', 'staff', 'admin');
const adminOnly = roleMiddleware('admin');

// -------- Student --------
router.get('/', authMiddleware, allRoles, getTimetable);
router.get('/changes', authMiddleware, allRoles, getScheduleChanges);

// -------- Admin — Periods (above any bare '/:id' pattern isn't an issue here since base path has none) --------
router.get('/admin', authMiddleware, adminOnly, getTimetableAdmin);
router.post('/', authMiddleware, adminOnly, createPeriod);
router.patch('/:id', authMiddleware, adminOnly, updatePeriod);
router.delete('/:id', authMiddleware, adminOnly, deletePeriod);

// -------- Admin — Schedule Changes --------
router.get('/changes/admin', authMiddleware, adminOnly, getScheduleChangesAdmin);
router.post('/changes', authMiddleware, adminOnly, createScheduleChange);
router.patch('/changes/:id', authMiddleware, adminOnly, updateScheduleChange);
router.delete('/changes/:id', authMiddleware, adminOnly, deleteScheduleChange);

module.exports = router;