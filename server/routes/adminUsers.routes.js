const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/adminUserController');

const adminOnly = roleMiddleware('admin');

router.get('/', authMiddleware, adminOnly, getAllUsers);

router.get('/:id', authMiddleware, adminOnly, getUserById);

router.patch('/:id', authMiddleware, adminOnly, updateUser);

router.delete('/:id', authMiddleware, adminOnly, deleteUser);

module.exports = router;