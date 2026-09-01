const { getImageKit, isImageKitConfigured } = require('../config/imagekit');

// Whitelist only — prevents the client from injecting an arbitrary ImageKit
// path via the 'folder' field. Add new entries here as new upload contexts
// come up (e.g. 'event-banners', 'canteen-menu-items').
const ALLOWED_FOLDERS = {
  'profile-photo': '/profile-photos',
  'cover-photo': '/cover-photos',
};

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!isImageKitConfigured()) {
      return res.status(503).json({
        message: 'Upload is not configured. Add ImageKit environment variables.',
      });
    }

    const folder = ALLOWED_FOLDERS[req.body.folder] || undefined;

    const imagekit = getImageKit();
    const result = await imagekit.upload({
      file: req.file.buffer.toString('base64'),
      fileName: req.file.originalname,
      ...(folder && { folder }),
    });

    res.status(201).json({ url: result.url, name: req.file.originalname });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = uploadFile;