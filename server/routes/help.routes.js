const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
  getHelpRequests,
  createHelpRequest,
  addResponse,
  deleteHelpRequest,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/helpController');

const allRoles = roleMiddleware('student', 'teacher', 'staff', 'admin');
const adminOnly = roleMiddleware('admin');

// Peer Help Requests
router.get('/requests', authMiddleware, allRoles, getHelpRequests);
router.post('/requests', authMiddleware, allRoles, createHelpRequest);
router.post('/requests/:id/responses', authMiddleware, allRoles, addResponse);
router.delete('/requests/:id', authMiddleware, allRoles, deleteHelpRequest);

// Department Contact Cards
router.get('/departments', authMiddleware, allRoles, getDepartments);
router.post('/departments', authMiddleware, adminOnly, createDepartment);
router.patch('/departments/:id', authMiddleware, adminOnly, updateDepartment);
router.delete('/departments/:id', authMiddleware, adminOnly, deleteDepartment);

module.exports = router;