const LostFoundItem = require('../models/LostFoundItem');

const createLostFoundItem = async (req, res) => {
  try {
    const { title, description, type, category, location, image } = req.body;

    if (!title || !description || !type || !category || !location) {
      return res.status(400).json({ message: 'title, description, type, category and location are required' });
    }

    const item = await LostFoundItem.create({
      title,
      description,
      type,
      category,
      location,
      image,
      createdBy: req.user.userId,
    });

    res.status(201).json({
      message: 'Lost & Found item created',
      item,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createLostFoundItem };