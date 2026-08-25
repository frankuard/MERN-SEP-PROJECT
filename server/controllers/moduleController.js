const Module = require('../models/Module');

// GET /api/modules
const getModules = async (req, res) => {
  try {
    const modules = await Module.find({}).sort({ code: 1 });
    res.status(200).json(modules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/modules
const createModule = async (req, res) => {
  try {
    const { code, name } = req.body;

    if (!code || !name) {
      return res.status(400).json({ message: 'code and name are required' });
    }

    const exists = await Module.findOne({ code: code.trim() });
    if (exists) {
      return res.status(400).json({ message: 'A module with this code already exists' });
    }

    const module = await Module.create({
      code: code.trim(),
      name: name.trim(),
    });

    res.status(201).json(module);
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/modules/:id
const updateModule = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) return res.status(404).json({ message: 'Module not found' });

    const { code, name } = req.body;
    if (code !== undefined) module.code = code.trim();
    if (name !== undefined) module.name = name.trim();

    const updated = await module.save();
    res.status(200).json(updated);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid module ID' });
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/modules/:id
const deleteModule = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) return res.status(404).json({ message: 'Module not found' });

    await module.deleteOne();
    res.status(200).json({ message: 'Module deleted' });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid module ID' });
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getModules, createModule, updateModule, deleteModule };