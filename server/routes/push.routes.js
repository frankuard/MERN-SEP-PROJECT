const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getVapidPublicKey, subscribe, unsubscribe } = require('../controllers/pushController');

// Public — browser needs the key before the user logs in
router.get('/vapid-public-key', getVapidPublicKey);

// Authenticated — store / remove a push subscription for the logged-in user
router.post('/subscribe',   authMiddleware, subscribe);
router.delete('/unsubscribe', authMiddleware, unsubscribe);

module.exports = router;
