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
  },
  { timestamps: true }
);

module.exports = mongoose.models.Module || mongoose.model('Module', moduleSchema);