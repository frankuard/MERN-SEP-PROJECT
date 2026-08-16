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

const getLostFoundItems = async (req, res) => {
  try {
    const items = await LostFoundItem.find();
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getLostFoundItem = async (req, res) => {
  try {
    const item = await LostFoundItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.status(200).json(item);

  } catch (err) {
    // Handles malformed MongoDB ObjectIds (e.g. "/api/lost-found/abc123")
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid item ID' });
    }
    res.status(500).json({ message: err.message });
  }
};

const claimLostFoundItem = async (req, res) => {
  try {
    const item = await LostFoundItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.status === 'claimed') {
      return res.status(400).json({ message: 'This item has already been claimed' });
    }

    if (item.status === 'resolved') {
      return res.status(400).json({ message: 'This item has already been resolved and cannot be claimed' });
    }

    item.claimedBy = req.user.userId;
    item.status = 'claimed';

    await item.save();

    res.status(200).json({
      message: 'Item claimed successfully',
      item,
    });

  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid item ID' });
    }
    res.status(500).json({ message: err.message });
  }
};

const resolveLostFoundItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const item = await LostFoundItem.findById(id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Ownership check — only the original creator can resolve their own post
    if (item.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Only the original creator can resolve this item' });
    }

    if (item.status === 'open') {
      return res.status(400).json({ message: 'This item has not been claimed yet' });
    }

    if (item.status === 'resolved') {
      return res.status(400).json({ message: 'This item has already been resolved' });
    }

    item.status = 'resolved';
    await item.save();

    res.status(200).json({
      message: 'Item resolved successfully',
      item,
    });

  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid item ID' });
    }
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createLostFoundItem, getLostFoundItems, getLostFoundItem, claimLostFoundItem, resolveLostFoundItem};

