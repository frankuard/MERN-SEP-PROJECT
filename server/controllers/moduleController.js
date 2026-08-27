const Module = require('../models/Module');

const getModules = async (req, res) => {
  try {
    const modules = await Module.find({}).sort({ code: 1 });
    res.status(200).json(modules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createModule = async (req, res) => {
  try {
    const { code, name } = req.body;
    if (!code || !name) return res.status(400).json({ message: 'code and name are required' });

    const module_ = await Module.create({ code: code.trim(), name: name.trim() });
    res.status(201).json(module_);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'A module with this code already exists' });
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

const updateModule = async (req, res) => {
  try {
    const module_ = await Module.findById(req.params.id);
    if (!module_) return res.status(404).json({ message: 'Module not found' });

    const { code, name } = req.body;
    if (code !== undefined) module_.code = code.trim();
    if (name !== undefined) module_.name = name.trim();

    const updated = await module_.save();
    res.status(200).json(updated);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid module ID' });
    if (err.code === 11000) return res.status(400).json({ message: 'A module with this code already exists' });
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

const deleteModule = async (req, res) => {
  try {
    const module_ = await Module.findById(req.params.id);
    if (!module_) return res.status(404).json({ message: 'Module not found' });

    await module_.deleteOne();
    res.status(200).json({ message: 'Module deleted' });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid module ID' });
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getModules, createModule, updateModule, deleteModule };