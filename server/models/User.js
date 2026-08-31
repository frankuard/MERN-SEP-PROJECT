const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ['student', 'teacher', 'staff', 'admin'],
      default: 'student',
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
    },

    department: {
      type: String,
      default: '',
    },

    // Admin-only. Which of the 5 new department admin panels this account
    // belongs to (super/canteen/ssd/rte/resources). Left unset (null) for
    // every existing admin account — their /admin route keeps going to the
    // original, unchanged admin dashboard. Only accounts that explicitly
    // have this set get routed to the new department-picker system.
    adminSection: {
      type: String,
      enum: ['super', 'canteen', 'ssd', 'rte', 'resources'],
      default: null,
    },

    semester: {
      type: String,
      default: '',
    },

    profileImage: {
      type: String,
      default: '',
    },

    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const User =
  mongoose.models.User ||
  mongoose.model('User', userSchema);

module.exports = User;