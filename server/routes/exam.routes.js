const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
  getExams,
  getExamsAdmin,
  createExam,
  updateExam,
  deleteExam,
} = require('../controllers/examController');

const allRoles  = roleMiddleware('student', 'teacher', 'staff', 'admin');
const adminOnly = roleMiddleware('admin');

// -------- Student (read-only, upcoming only) --------
router.get('/',      authMiddleware, allRoles,  getExams);

// -------- Admin (registered before '/:id') --------
router.get('/admin', authMiddleware, adminOnly, getExamsAdmin);
router.post('/',     authMiddleware, adminOnly, createExam);
router.patch('/:id', authMiddleware, adminOnly, updateExam);
router.delete('/:id',authMiddleware, adminOnly, deleteExam);

module.exports = router;
