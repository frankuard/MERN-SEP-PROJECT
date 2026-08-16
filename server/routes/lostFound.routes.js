const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { createLostFoundItem } = require('../controllers/lostFoundController');

router.post('/', authMiddleware, roleMiddleware('student'), createLostFoundItem);

module.exports = router;