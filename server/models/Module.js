const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Module code is required'],
      trim: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Module name is required'],
      trim: true,
    },
    level: {
      type: Number,
      enum: [3, 4, 5, 6, 7, 8],
      default: 4,
    },
    // Semesters this module belongs to (e.g. [1, 2] for Level 4, [3, 4] for Level 5, [5, 6] for Level 6)
    semesters: {
      type: [Number],
      default: [1, 2],
    },
    department: {
      type: String,
      default: 'BCS',
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Module || mongoose.model('Module', moduleSchema);