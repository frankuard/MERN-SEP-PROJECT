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
  getTeacherUpcomingClasses,
} = require('../controllers/timetableController');

const allRoles    = roleMiddleware('student', 'teacher', 'staff', 'admin');
const teacherOnly = roleMiddleware('teacher');
const adminOnly   = roleMiddleware('admin');

// -------- Student / all-roles --------
router.get('/',       authMiddleware, allRoles,    getTimetable);
router.get('/changes',authMiddleware, allRoles,    getScheduleChanges);

// -------- Teacher --------
router.get('/teacher/upcoming', authMiddleware, teacherOnly, getTeacherUpcomingClasses);

// -------- Admin — Periods (registered before '/:id' patterns) --------
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