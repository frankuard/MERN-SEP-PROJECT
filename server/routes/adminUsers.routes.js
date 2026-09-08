const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const superAdminOnly = require('../middleware/superAdminMiddleware');

const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  createStaffAccount,
  resetStaffPassword,
} = require('../controllers/adminUserController');

const adminOnly = roleMiddleware('admin');

router.post('/staff', authMiddleware, superAdminOnly, createStaffAccount);
router.patch('/:id/reset-password', authMiddleware, superAdminOnly, resetStaffPassword);

router.get('/', authMiddleware, adminOnly, getAllUsers);

router.get('/:id', authMiddleware, adminOnly, getUserById);

router.patch('/:id', authMiddleware, adminOnly, updateUser);

router.delete('/:id', authMiddleware, adminOnly, deleteUser);

module.exports = router;