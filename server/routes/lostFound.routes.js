const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
  getLostFoundItems,
  getLostFoundItem,
  createLostFoundItem,
  updateLostFoundItem,
  deleteLostFoundItem,
  claimLostFoundItem,
  markItemReturned,
  createCctvRequest,
  getCctvRequests,
  updateCctvStatus,
  getLostFoundStats,
  updateClaimStatus,
} = require('../controllers/lostFoundController');

const allRoles = roleMiddleware('student', 'teacher', 'staff', 'admin');
const staffAndAdmin = roleMiddleware('staff', 'admin');

// 1. Statistics & Overview
router.get('/stats', authMiddleware, allRoles, getLostFoundStats);

// 2. CCTV Footage Requests
router.get('/cctv-requests', authMiddleware, allRoles, getCctvRequests);
router.post('/cctv-request', authMiddleware, allRoles, createCctvRequest);
router.patch('/cctv-request/:id/status', authMiddleware, staffAndAdmin, updateCctvStatus);

// 3. Lost & Found Items CRUD
router.get('/', authMiddleware, allRoles, getLostFoundItems);
router.post('/', authMiddleware, allRoles, createLostFoundItem);
router.get('/:id', authMiddleware, allRoles, getLostFoundItem);
router.patch('/:id', authMiddleware, allRoles, updateLostFoundItem);
router.delete('/:id', authMiddleware, allRoles, deleteLostFoundItem);

// 4. Claims & Return Workflow
router.post('/:id/claim', authMiddleware, allRoles, claimLostFoundItem);
router.patch('/:id/claim', authMiddleware, allRoles, claimLostFoundItem);
router.patch('/:id/return', authMiddleware, allRoles, markItemReturned);
router.patch('/:itemId/claim/:claimId/status', authMiddleware, staffAndAdmin, updateClaimStatus);

module.exports = router;