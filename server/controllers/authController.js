const bcrypt = require('bcryptjs');
const User = require('../models/User');

const register = async (req, res) => {
  try {
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

module.exports = { register };