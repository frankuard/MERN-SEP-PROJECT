const { getImageKit, isImageKitConfigured } = require('../config/imagekit');

// Whitelist only — prevents the client from injecting an arbitrary ImageKit
// path via the 'folder' field. Add new entries here as new upload contexts
// come up (e.g. 'event-banners', 'canteen-menu-items').
const ALLOWED_FOLDERS = {
  'profile-photo': '/profile-photos',
  'cover-photo': '/cover-photos',
};

// Sanitize a username into something safe to use as a folder name — strips
// anything that isn't alphanumeric, dash, or underscore.
const sanitizeSegment = (value) =>
  String(value || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');

const resolveFolder = (req) => {
  const requested = req.body.folder;

  // Chat attachments get a per-user subfolder. The username comes from the
  // authenticated user (req.user), never from client input — so nobody can
  // spoof their way into someone else's folder.
  if (requested === 'chat-attachment') {
    // req.user is the full Mongoose User doc (set by authMiddleware),
    // so _id always exists as a safe fallback even if username doesn't.
    const username = sanitizeSegment(req.user?.username || req.user?._id);
    return `/chat-attachments/${username}`;
  }

  return ALLOWED_FOLDERS[requested] || undefined;
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

    const folder = resolveFolder(req);

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