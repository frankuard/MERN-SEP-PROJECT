const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { chat } = require('../controllers/aiChatController');

// POST /api/ai/chat — protected; authMiddleware sets req.user from the JWT cookie
router.post('/chat', authMiddleware, chat);

module.exports = router;
