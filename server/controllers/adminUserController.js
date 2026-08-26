const User = require('../models/User');

// GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const { role, department, search } = req.query;
    const filter = {};

    if (role && role !== 'All') filter.role = role;
    if (department && department !== 'All') filter.department = department;
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter).select('-password').sort({ username: 1 });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid user ID' });
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/admin/users/:id
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { username, department, semester } = req.body;

    if (username !== undefined) {
      const trimmed = username.trim();
      if (!trimmed) return res.status(400).json({ message: 'Username cannot be empty' });

      const exists = await User.findOne({ username: trimmed, _id: { $ne: user._id } });
      if (exists) return res.status(400).json({ message: 'That username is already taken' });

      user.username = trimmed;
    }
    if (department !== undefined) user.department = department.trim();
    if (semester !== undefined) user.semester = semester.trim();

    const updated = await user.save();
    const { password, ...safeUser } = updated.toObject();
    res.status(200).json(safeUser);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid user ID' });
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: 'User deleted successfully',
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};