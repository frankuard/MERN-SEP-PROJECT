const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcementController');

const allRoles = roleMiddleware('student', 'teacher', 'staff', 'admin');
const adminOnly = roleMiddleware('admin');

router.get('/', authMiddleware, allRoles, getAnnouncements);
router.get('/:id', authMiddleware, allRoles, getAnnouncementById);

router.post('/', authMiddleware, adminOnly, createAnnouncement);
router.patch('/:id', authMiddleware, adminOnly, updateAnnouncement);
router.delete('/:id', authMiddleware, adminOnly, deleteAnnouncement);

module.exports = router;