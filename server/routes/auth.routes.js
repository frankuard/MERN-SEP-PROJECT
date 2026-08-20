const express = require('express');
const router = express.Router();
const { register, loginUser } = require('../controllers/authController');
const { googleAuth, getGoogleConfig } = require('../controllers/googleAuthController');

router.post('/register', register);
router.post('/login', loginUser);
router.post('/google', googleAuth);
router.get('/google/config', getGoogleConfig);

module.exports = router;