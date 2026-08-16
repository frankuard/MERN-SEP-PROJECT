const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { createLostFoundItem, getLostFoundItem, getLostFoundItems, claimLostFoundItem, resolveLostFoundItem } = require('../controllers/lostFoundController');

router.post('/', authMiddleware, roleMiddleware('student','teacher','staff','admin'), createLostFoundItem);
router.get('/', authMiddleware, roleMiddleware('student','teacher','staff','admin'), getLostFoundItems);
router.get('/:id', authMiddleware, roleMiddleware('student','teacher','staff','admin'), getLostFoundItem);
router.patch('/:id/claim', authMiddleware, roleMiddleware('student', 'teacher', 'staff','admin'), claimLostFoundItem);
router.patch('/:id/resolve', authMiddleware, roleMiddleware('student', 'teacher', 'staff','admin'), resolveLostFoundItem);



module.exports = router;