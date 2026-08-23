const { getImageKit, isImageKitConfigured } = require('../config/imagekit');

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

    const imagekit = getImageKit();
    const result = await imagekit.upload({
      file: req.file.buffer.toString('base64'),
      fileName: req.file.originalname,
    });

    res.status(201).json({ url: result.url, name: req.file.originalname });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = uploadFile;