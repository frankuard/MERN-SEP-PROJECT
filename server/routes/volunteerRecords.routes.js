const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
  getMyVolunteerHistory,
  getAllVolunteerRecordsAdmin,
  createVolunteerRecord,
  updateVolunteerRecord,
  deleteVolunteerRecord,
} = require('../controllers/volunteerController');

const allRoles = roleMiddleware('student', 'teacher', 'staff', 'admin');
const adminOnly = roleMiddleware('admin');

// -------- Student --------
router.get('/mine', authMiddleware, allRoles, getMyVolunteerHistory);

// -------- Admin (registered before '/:id') --------
router.get('/admin', authMiddleware, adminOnly, getAllVolunteerRecordsAdmin);
router.post('/', authMiddleware, adminOnly, createVolunteerRecord);
router.patch('/:id', authMiddleware, adminOnly, updateVolunteerRecord);
router.delete('/:id', authMiddleware, adminOnly, deleteVolunteerRecord);

module.exports = router;