const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
  createRequest,
  getMyRequests,
  cancelMyRequest,
  getAllRequests,
  reviewRequest,
} = require('../controllers/classroomRequestController');

const allRoles = roleMiddleware('student', 'teacher', 'staff', 'admin');
const adminOnly = roleMiddleware('admin');

// -------- Admin (registered first — /admin must not fall into /:id) --------
router.get('/admin', authMiddleware, adminOnly, getAllRequests);
router.patch('/:id/review', authMiddleware, adminOnly, reviewRequest);

// -------- Student --------
router.get('/mine', authMiddleware, allRoles, getMyRequests);
router.post('/', authMiddleware, allRoles, createRequest);
router.delete('/:id', authMiddleware, allRoles, cancelMyRequest);

module.exports = router;