const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema(
  {
    code: {
      type: String, // e.g. "4CS001"
      required: [true, 'Module code is required'],
      trim: true,
      unique: true,
    },
    name: {
      type: String, // e.g. "Introductory Programming and Problem Solving"
      required: [true, 'Module name is required'],
      trim: true,
    },
  },
  { timestamps: true }
);

const Module = mongoose.models.Module || mongoose.model('Module', moduleSchema);

module.exports = Module;