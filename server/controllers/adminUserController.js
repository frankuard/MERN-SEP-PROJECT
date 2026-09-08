const bcrypt = require('bcryptjs');
const User = require('../models/User');
const CanteenCredit = require('../models/CanteenCredit');
const { createNotification } = require('../utils/createNotification');
const { isKnownTeacherName } = require('../utils/normalizeName');

const ADMIN_SECTIONS = ['super', 'canteen', 'ssd', 'rte', 'resources'];

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

    const previous = {
  username: user.username,
  department: user.department,
  semester: user.semester,
  group: user.group,
};

const { username, department, semester, group } = req.body;

    if (username !== undefined) {
      const trimmed = username.trim();
      if (!trimmed) return res.status(400).json({ message: 'Username cannot be empty' });

      const exists = await User.findOne({ username: trimmed, _id: { $ne: user._id } });
      if (exists) return res.status(400).json({ message: 'That username is already taken' });

      user.username = trimmed;
    }
    if (department !== undefined) user.department = department.trim();
if (semester !== undefined) user.semester = semester.trim();
if (group !== undefined) user.group = group.trim();

    const updated = await user.save();

    const changes = [];
    if (previous.username !== updated.username) changes.push(`username to "${updated.username}"`);
    if (previous.department !== updated.department) changes.push(`department to "${updated.department}"`);
    if (previous.semester !== updated.semester) changes.push(`semester to "${updated.semester}"`);
if (previous.group !== updated.group) changes.push(`group to "${updated.group}"`);

    if (changes.length > 0) {
      createNotification(updated._id, {
        type: 'profile_update',
        title: 'Profile Updated',
        message: `An admin updated your ${changes.join(', ')}.`,
        link: 'dashboard',
      });
    }

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

    // Cascade — a user should never leave behind an orphaned credit record.
    await CanteenCredit.findOneAndDelete({ user: req.params.id });

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

// POST /api/admin/users/staff  (super admin only)
// Creates a teacher, admin, or community account. Admin accounts
// require adminSection; teacher accounts use department. Community
// accounts use the 'staff' role value and require no department.
const createStaffAccount = async (req, res) => {
  try {
    const { username, email, password, role, department, adminSection } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'username, email and password are required' });
    }

    if (!['teacher', 'staff', 'admin'].includes(role)) {
      return res.status(400).json({ message: "role must be 'teacher', 'staff', or 'admin'" });
    }

    if (role === 'admin' && !ADMIN_SECTIONS.includes(adminSection)) {
      return res.status(400).json({ message: `adminSection must be one of: ${ADMIN_SECTIONS.join(', ')}` });
    }

    if (role === 'teacher') {
      const matchesLecturer = await isKnownTeacherName(username);
      if (!matchesLecturer) {
        return res.status(400).json({
          message: 'This username does not match any lecturer name in the timetable. Check spelling (it should match the name as it appears in the timetable, titles like "Mr."/"Dr." are ignored), or add the module to the timetable first.',
        });
      }
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const trimmedUsername = username.trim();

    const existingUsername = await User.findOne({ username: trimmedUsername });
    if (existingUsername) {
      return res.status(409).json({ message: 'Username is already taken' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      username: trimmedUsername,
      email,
      password: hashedPassword,
      role,
      status: 'approved',
    };

    if (role === 'teacher') {
      userData.department = (department || '').trim();
    } else if (role === 'admin') {
      userData.department = 'Administration';
      userData.adminSection = adminSection;
    }
    // role value 'staff' (Community): no department, no adminSection required.

    const user = await User.create(userData);

    const { password: _pw, ...safeUser } = user.toObject();
    res.status(201).json(safeUser);
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};
// PATCH /api/admin/users/:id/reset-password  (super admin only)
const resetStaffPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    res.status(200).json({
      message: 'Password reset successfully',
      username: user.username,
      email: user.email,
    });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid user ID' });
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  createStaffAccount,
  resetStaffPassword,
};