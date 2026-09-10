const Module = require('../models/Module');

// Helper to infer level and semesters based on standard UK module code conventions:
// 4CS / 4MM -> Level 4 (Semesters 1 & 2)
// 5CS / 5MM -> Level 5 (Semesters 3 & 4)
// 6CS / 6MM -> Level 6 (Semesters 5 & 6)
const inferLevelAndSemesters = (code = '') => {
  const clean = code.trim().toUpperCase();
  if (clean.startsWith('4')) {
    return { level: 4, semesters: [1, 2] };
  }
  if (clean.startsWith('5')) {
    return { level: 5, semesters: [3, 4] };
  }
  if (clean.startsWith('6')) {
    return { level: 6, semesters: [5, 6] };
  }
  return { level: 4, semesters: [1, 2] };
};

const getModules = async (req, res) => {
  try {
    const filter = {};
    if (req.query.level) filter.level = Number(req.query.level);
    if (req.query.semester) {
      filter.semesters = { $in: [Number(req.query.semester)] };
    }
    if (req.query.department) filter.department = req.query.department;

    const modules = await Module.find(filter).sort({ code: 1 });
    res.status(200).json(modules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createModule = async (req, res) => {
  try {
    const { code, name, level, semesters, semester, department } = req.body;
    if (!code || !name) return res.status(400).json({ message: 'code and name are required' });

    const inferred = inferLevelAndSemesters(code);

    let parsedLevel = level !== undefined && level !== null ? Number(level) : inferred.level;
    let parsedSemesters = inferred.semesters;

    if (Array.isArray(semesters) && semesters.length > 0) {
      parsedSemesters = semesters.map(Number).filter((n) => !Number.isNaN(n));
    } else if (semester !== undefined && semester !== null && semester !== '') {
      parsedSemesters = [Number(semester)];
    }

    const module_ = await Module.create({
      code: code.trim(),
      name: name.trim(),
      level: parsedLevel,
      semesters: parsedSemesters,
      department: department ? department.trim() : 'BCS',
    });
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

    const { code, name, level, semesters, semester, department } = req.body;
    if (code !== undefined) module_.code = code.trim();
    if (name !== undefined) module_.name = name.trim();
    if (level !== undefined && level !== null) module_.level = Number(level);
    if (Array.isArray(semesters) && semesters.length > 0) {
      module_.semesters = semesters.map(Number).filter((n) => !Number.isNaN(n));
    } else if (semester !== undefined && semester !== null && semester !== '') {
      module_.semesters = [Number(semester)];
    }
    if (department !== undefined) module_.department = department.trim();

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

module.exports = { getModules, createModule, updateModule, deleteModule, inferLevelAndSemesters };