const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
  getMyAttendance,
  getMyAttendanceLog,
  createReportRequest,
  getMyReportRequests,
  getAllAttendanceAdmin,
  getAttendanceSummaryAdmin,
  quickSetAttendance,
  markAttendance,
  updateAttendance,
  deleteAttendance,
  getAllReportRequestsAdmin,
  updateReportRequest,
} = require('../controllers/attendanceController');

const allRoles = roleMiddleware('student', 'teacher', 'staff', 'admin');
const adminOnly = roleMiddleware('admin');

// -------- Student --------
router.get('/mine', authMiddleware, allRoles, getMyAttendance);
router.get('/mine/log', authMiddleware, allRoles, getMyAttendanceLog);
router.post('/report-requests', authMiddleware, allRoles, createReportRequest);
router.get('/report-requests/mine', authMiddleware, allRoles, getMyReportRequests);

// -------- Admin (registered before '/:id') --------
router.get('/admin/summary', authMiddleware, adminOnly, getAttendanceSummaryAdmin);
router.get('/admin', authMiddleware, adminOnly, getAllAttendanceAdmin);
router.post('/quick-set/:studentId', authMiddleware, adminOnly, quickSetAttendance);
router.get('/report-requests/admin', authMiddleware, adminOnly, getAllReportRequestsAdmin);
router.patch('/report-requests/:id', authMiddleware, adminOnly, updateReportRequest);
router.post('/', authMiddleware, adminOnly, markAttendance);
router.patch('/:id', authMiddleware, adminOnly, updateAttendance);
router.delete('/:id', authMiddleware, adminOnly, deleteAttendance);

module.exports = router;