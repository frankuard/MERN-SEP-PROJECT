const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { getDbStatus } = require('../config/db');

const generateToken = require('../utils/generateToken');

const ensureDatabase = (res) => {
  if (!getDbStatus().connected) {
    res.status(503).json({ message: 'Database is unavailable. Please try again later.' });
    return false;
  }
  return true;
};

// REGISTER PART
const register = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;

    const { username, email, password, role, department, semester } = req.body;

    // 1. Required field validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'username, email and password are required' });
    }

    // 2. Role validation — admin cannot self-register
    const allowedRoles = ['student', 'teacher', 'staff'];
    if (role && role === 'admin') {
      return res.status(403).json({ message: 'Public registration as admin is not allowed' });
    }
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ message: `role must be one of: ${allowedRoles.join(', ')}` });
    }
    const finalRole = role || 'student';

    // 3. Check duplicate email
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    // 4. Check duplicate username
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({ message: 'Username is already taken' });
    }

    // 5. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 6. Determine status — backend decides this, client cannot override it
    const status = finalRole === 'student' ? 'approved' : 'pending';

    // 7. Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: finalRole,
      status,
      department,
      semester,
    });

    // 8. Build response without password
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      department: user.department,
      semester: user.semester,
      createdAt: user.createdAt,
    };

    if (status === 'approved') {
      return res.status(201).json({
        message: 'Account created and approved successfully',
        user: userResponse,
      });
    } else {
      return res.status(201).json({
        message: 'Account created successfully. Waiting for admin approval.',
        user: userResponse,
      });
    }

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// LOGIN PART
const loginUser = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;

    const { email, password } = req.body;

    // 1 & 2. Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    // 3. Find user by email
    const user = await User.findOne({ email });

    // 4. User not found
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 5. Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    // 6. Wrong password — same generic message as "user not found"
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 7. Check account status
    if (user.status === 'pending') {
      return res.status(403).json({ message: 'Your account is pending admin approval' });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({ message: 'Your account request was rejected. Contact admin.' });
    }

    // 8. Generate JWT
    const token = generateToken(user._id, user.role);

    // 9. Success response
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { register, loginUser };
