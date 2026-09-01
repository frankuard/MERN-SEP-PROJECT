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

    coverPhoto: {
      type: String,
      default: '',
    },

    bio: {
      type: String,
      default: '',
      trim: true,
      maxlength: [280, 'Bio cannot exceed 280 characters'],
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

// Track whether this document was new *before* save() flips isNew to false,
// so the post-save hook below knows whether to create a credit record.
// (No `next` parameter/call here — Mongoose 7+ removed callback-style
// middleware; hooks just run synchronously or return a promise.)
userSchema.pre('save', function () {
  this._wasNew = this.isNew;
});

// Every user gets a CanteenCredit record the moment their account is
// created — so the credit/khata section is never "missing" on the user
// panel again, even before they've ever been charged anything.
userSchema.post('save', async function (doc) {
  if (!doc._wasNew) return;
  try {
    const CanteenCredit = require('./CanteenCredit');
    const exists = await CanteenCredit.findOne({ user: doc._id });
    if (!exists) {
      await CanteenCredit.create({
        user: doc._id,
        studentName: doc.username,
        amountDue: 0,
        amountPaid: 0,
      });
    }
  } catch (err) {
    console.error(`Failed to auto-create CanteenCredit for user ${doc._id}:`, err.message);
  }
});

const User =
  mongoose.models.User ||
  mongoose.model('User', userSchema);

module.exports = User;