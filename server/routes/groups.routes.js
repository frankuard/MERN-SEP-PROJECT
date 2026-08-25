const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { getGroups, createGroup, updateGroup, deleteGroup } = require('../controllers/groupController');

const allRoles = roleMiddleware('student', 'teacher', 'staff', 'admin');
const adminOnly = roleMiddleware('admin');

router.get('/', authMiddleware, allRoles, getGroups);
router.post('/', authMiddleware, adminOnly, createGroup);
router.patch('/:id', authMiddleware, adminOnly, updateGroup);
router.delete('/:id', authMiddleware, adminOnly, deleteGroup);

module.exports = router;