const express = require('express');

const router = express.Router();

const { uploadImage, uploadDocument } = require('../middleware/upload');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const uploadFile = require('../controllers/uploadController');

// Images only — events, canteen menu, organizer logos, etc.
router.post(
  '/',
  authMiddleware,
  roleMiddleware('student', 'teacher', 'staff', 'admin'),
  uploadImage.single('image'),
  uploadFile
);

// Documents + images — Campus Help attachments
router.post(
  '/document',
  authMiddleware,
  roleMiddleware('student', 'teacher', 'staff', 'admin'),
  uploadDocument.single('file'),
  uploadFile
);

module.exports = router;