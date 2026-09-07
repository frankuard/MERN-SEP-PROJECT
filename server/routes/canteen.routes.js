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
  placeOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  confirmCounterPayment,
  getAllCreditRequests,
  getMyCreditRequests,
  reviewCreditRequest,
} = require('../controllers/canteenController');

const allRoles = roleMiddleware('student', 'teacher', 'staff', 'admin');
const staffAndAdmin = roleMiddleware('staff', 'admin');
const studentAndTeacher = roleMiddleware('student', 'teacher');

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

// Orders
router.post('/orders', authMiddleware, studentAndTeacher, placeOrder);
router.get('/orders/my', authMiddleware, studentAndTeacher, getMyOrders);
router.get('/orders', authMiddleware, staffAndAdmin, getAllOrders);
router.get('/orders/:id', authMiddleware, allRoles, getOrderById);
router.put('/orders/:id/status', authMiddleware, staffAndAdmin, updateOrderStatus);
router.post('/orders/:id/confirm-payment', authMiddleware, staffAndAdmin, confirmCounterPayment);

// Credit Requests
router.get('/credit-requests/my', authMiddleware, studentAndTeacher, getMyCreditRequests);
router.get('/credit-requests', authMiddleware, staffAndAdmin, getAllCreditRequests);
router.put('/credit-requests/:id', authMiddleware, staffAndAdmin, reviewCreditRequest);

module.exports = router;