const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { getAnnouncements, getAnnouncementById } = require('../controllers/announcementController');

const allRoles = roleMiddleware('student', 'teacher', 'staff', 'admin');

router.get('/', authMiddleware, allRoles, getAnnouncements);
router.get('/:id', authMiddleware, allRoles, getAnnouncementById);

module.exports = router;