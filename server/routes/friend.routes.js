const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  sendFriendRequest,
  respondToFriendRequest,
  getFriendRequests,
  getFriends,
} = require('../controllers/friendController');

router.post('/request', authMiddleware, sendFriendRequest);
router.patch('/request/:id', authMiddleware, respondToFriendRequest);
router.get('/requests', authMiddleware, getFriendRequests);
router.get('/', authMiddleware, getFriends);

module.exports = router;