const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
  // Menu
  getMenu,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  // Credit
  getAllCredits,
  getMyCredit,
  getCreditById,
  createOrUpdateCredit,
  recordCreditPayment,
  deleteCreditRecord,
} = require('../controllers/canteenController');

// =====================================================
// 1. CANTEEN MENU ROUTES
// =====================================================

// Public / Authenticated View Menu
router.get('/menu', getMenu);
router.get('/menu/:id', getMenuItemById);

// Admin / Staff Menu Management (CRUD)
router.post(
  '/menu',
  authMiddleware,
  roleMiddleware('admin', 'staff'),
  createMenuItem
);

router.put(
  '/menu/:id',
  authMiddleware,
  roleMiddleware('admin', 'staff'),
  updateMenuItem
);

router.delete(
  '/menu/:id',
  authMiddleware,
  roleMiddleware('admin', 'staff'),
  deleteMenuItem
);

// =====================================================
// 2. CANTEEN CREDIT / KHATA ROUTES
// =====================================================

// Logged-in student's own balance & payment history
router.get(
  '/credit/my-balance',
  authMiddleware,
  getMyCredit
);

// Admin / Staff view all accounts
router.get(
  '/credit',
  authMiddleware,
  roleMiddleware('admin', 'staff'),
  getAllCredits
);

// Admin / Staff view single account
router.get(
  '/credit/:id',
  authMiddleware,
  roleMiddleware('admin', 'staff'),
  getCreditById
);

// Admin / Staff add/charge credit due
router.post(
  '/credit',
  authMiddleware,
  roleMiddleware('admin', 'staff'),
  createOrUpdateCredit
);

// Admin / Staff record cash/online payment to clear credit
router.post(
  '/credit/:id/pay',
  authMiddleware,
  roleMiddleware('admin', 'staff'),
  recordCreditPayment
);

// Admin / Staff delete credit account
router.delete(
  '/credit/:id',
  authMiddleware,
  roleMiddleware('admin', 'staff'),
  deleteCreditRecord
);

module.exports = router;
