const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { createTestPost, getTestPosts } = require('../controllers/testPostController');

router.post('/', authMiddleware, roleMiddleware('student'), createTestPost);
router.get('/', authMiddleware, roleMiddleware('student'), getTestPosts);

module.exports = router;