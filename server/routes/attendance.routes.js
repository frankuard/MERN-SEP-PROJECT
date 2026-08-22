const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { getMyAttendance, adminSetAttendance, getAllStudentsAttendance } = require('../controllers/attendanceController');

router.get('/my', authMiddleware, roleMiddleware('student'), getMyAttendance);
router.post('/student/:userId', authMiddleware, roleMiddleware('admin'), adminSetAttendance);
router.get('/admin/all', authMiddleware, roleMiddleware('admin'), getAllStudentsAttendance);


module.exports = router;