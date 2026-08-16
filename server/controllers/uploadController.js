const imagekit = require('../config/imagekit');

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const result = await imagekit.upload({
      file: req.file.buffer.toString('base64'),
      fileName: req.file.originalname,
    });

    res.status(201).json({ url: result.url });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = uploadImage;