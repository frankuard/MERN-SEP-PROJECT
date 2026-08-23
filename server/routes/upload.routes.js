const express = require('express');

const router = express.Router();

const upload = require('../middleware/upload');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const uploadImage = require('../controllers/uploadController');

router.post(
  '/',
  authMiddleware,
  roleMiddleware('student', 'teacher', 'staff', 'admin'),
  upload.single('image'),
  uploadImage
);

module.exports = router;