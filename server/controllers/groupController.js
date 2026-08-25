const Group = require('../models/Group');

// GET /api/groups
const getGroups = async (req, res) => {
  try {
    const groups = await Group.find({}).sort({ name: 1 });
    res.status(200).json(groups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/groups
const createGroup = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const exists = await Group.findOne({ name: name.trim() });
    if (exists) {
      return res.status(400).json({ message: 'A group with this name already exists' });
    }

    const group = await Group.create({ name: name.trim() });
    res.status(201).json(group);
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/groups/:id
const updateGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const { name } = req.body;
    if (name !== undefined) group.name = name.trim();

    const updated = await group.save();
    res.status(200).json(updated);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid group ID' });
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/groups/:id
const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    await group.deleteOne();
    res.status(200).json({ message: 'Group deleted' });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid group ID' });
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getGroups, createGroup, updateGroup, deleteGroup };