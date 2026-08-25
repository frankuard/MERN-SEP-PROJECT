const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { getModules, createModule, updateModule, deleteModule } = require('../controllers/moduleController');

const allRoles = roleMiddleware('student', 'teacher', 'staff', 'admin');
const adminOnly = roleMiddleware('admin');

router.get('/', authMiddleware, allRoles, getModules);
router.post('/', authMiddleware, adminOnly, createModule);
router.patch('/:id', authMiddleware, adminOnly, updateModule);
router.delete('/:id', authMiddleware, adminOnly, deleteModule);

module.exports = router;