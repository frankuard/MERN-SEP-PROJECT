const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { uploadAudio } = require('../middleware/upload');
const { chat, confirmAction, cancelAction, chooseAction, transcribe } = require('../controllers/aiChatController');

// POST /api/ai/chat — protected; authMiddleware sets req.user from the JWT cookie
router.post('/chat', authMiddleware, chat);

// Action flow controls — all protected, keyed to the authenticated user
router.post('/confirm', authMiddleware, confirmAction);
router.post('/cancel', authMiddleware, cancelAction);
router.post('/choose', authMiddleware, chooseAction);

// Voice → text via Groq whisper (multipart 'audio' field)
router.post('/transcribe', authMiddleware, uploadAudio.single('audio'), transcribe);

module.exports = router;