const express = require('express');
const router = express.Router();
const { register, loginUser, logoutUser, getMe } = require('../controllers/authController');
const { googleAuth, getGoogleConfig } = require('../controllers/googleAuthController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/me', authMiddleware, getMe);
router.post('/google', googleAuth);
router.get('/google/config', getGoogleConfig);

module.exports = router;