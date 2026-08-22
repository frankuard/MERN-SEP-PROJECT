const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { getMyAttendance, adminSetAttendance } = require('../controllers/attendanceController');

router.get('/my', authMiddleware, roleMiddleware('student'), getMyAttendance);
router.post('/student/:userId', authMiddleware, roleMiddleware('admin'), adminSetAttendance);

module.exports = router;