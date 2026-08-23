const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
  getMenu,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getAllCredits,
  getMyCredit,
  getCreditById,
  createOrUpdateCredit,
  recordCreditPayment,
  deleteCreditRecord,
} = require('../controllers/canteenController');

const allRoles = roleMiddleware('student', 'teacher', 'staff', 'admin');
const staffAndAdmin = roleMiddleware('staff', 'admin');

// Menu
router.get('/menu', authMiddleware, allRoles, getMenu);
router.get('/menu/:id', authMiddleware, allRoles, getMenuItemById);
router.post('/menu', authMiddleware, staffAndAdmin, createMenuItem);
router.put('/menu/:id', authMiddleware, staffAndAdmin, updateMenuItem);
router.delete('/menu/:id', authMiddleware, staffAndAdmin, deleteMenuItem);

// Credit
router.get('/credit/my-balance', authMiddleware, allRoles, getMyCredit);
router.get('/credit', authMiddleware, staffAndAdmin, getAllCredits);
router.get('/credit/:id', authMiddleware, staffAndAdmin, getCreditById);
router.post('/credit', authMiddleware, staffAndAdmin, createOrUpdateCredit);
router.post('/credit/:id/pay', authMiddleware, staffAndAdmin, recordCreditPayment);
router.delete('/credit/:id', authMiddleware, staffAndAdmin, deleteCreditRecord);

module.exports = router;