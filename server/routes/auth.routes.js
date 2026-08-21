const express = require('express');

const router = express.Router();

const {
  register,
  loginUser,
  logoutUser,
  getMe,
} = require('../controllers/authController');

const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', register);

router.post('/login', loginUser);

router.post('/logout', logoutUser);

router.get('/me', authMiddleware, getMe);

module.exports = router;