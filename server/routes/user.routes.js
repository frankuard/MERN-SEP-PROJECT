const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { updateMe, changePassword, getUserProfile } = require('../controllers/userController');

router.patch('/me', authMiddleware, updateMe);
router.patch('/me/password', authMiddleware, changePassword);
router.get('/:id', authMiddleware, getUserProfile);

module.exports = router;