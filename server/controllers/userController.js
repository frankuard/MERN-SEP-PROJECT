const bcrypt = require('bcryptjs');
const User = require('../models/User');

// PATCH /api/users/me — update username and/or bio for the logged-in user
const updateMe = async (req, res) => {
  try {
    const { username, bio, profileImage, coverPhoto } = req.body;
    const updates = {};

    if (username !== undefined) {
      const trimmed = username.trim();
      if (!trimmed) {
        return res.status(400).json({ message: 'Username cannot be empty' });
      }
      if (trimmed !== req.user.username) {
        const existing = await User.findOne({ username: trimmed });
        if (existing) {
          return res.status(409).json({ message: 'Username is already taken' });
        }
      }
      updates.username = trimmed;
    }

    if (bio !== undefined) {
      if (bio.length > 280) {
        return res.status(400).json({ message: 'Bio cannot exceed 280 characters' });
      }
      updates.bio = bio.trim();
    }

    if (profileImage !== undefined) {
      updates.profileImage = profileImage;
    }

    if (coverPhoto !== undefined) {
      updates.coverPhoto = coverPhoto;
    }

    const updated = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: updated._id,
        _id: updated._id,
        username: updated.username,
        email: updated.email,
        role: updated.role,
        bio: updated.bio,
        department: updated.department,
        semester: updated.semester,
        adminSection: updated.adminSection,
        profileImage: updated.profileImage,
        coverPhoto: updated.coverPhoto,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// PATCH /api/users/me/password — change the logged-in user's password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// GET /api/users/:id — public-safe profile view of another user
const getUserProfile = async (req, res) => {
  try {
    const target = await User.findById(req.params.id).select(
      'username bio profileImage coverPhoto department role'
    );
    if (!target) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ user: target });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { updateMe, changePassword, getUserProfile };