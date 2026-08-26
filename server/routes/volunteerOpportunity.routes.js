const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
  getOpportunities,
  applyToOpportunity,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  getAllOpportunitiesAdmin,
  getOpportunityApplicants,
} = require('../controllers/volunteerOpportunityController');

const allRoles = roleMiddleware('student', 'teacher', 'staff', 'admin');
const adminOnly = roleMiddleware('admin');

// -------- Student --------
router.get('/', authMiddleware, allRoles, getOpportunities);
router.post('/:id/apply', authMiddleware, allRoles, applyToOpportunity);

// -------- Admin (registered before '/:id') --------
router.get('/admin/all', authMiddleware, adminOnly, getAllOpportunitiesAdmin);
router.get('/:id/applicants', authMiddleware, adminOnly, getOpportunityApplicants);
router.post('/', authMiddleware, adminOnly, createOpportunity);
router.patch('/:id', authMiddleware, adminOnly, updateOpportunity);
router.delete('/:id', authMiddleware, adminOnly, deleteOpportunity);

module.exports = router;