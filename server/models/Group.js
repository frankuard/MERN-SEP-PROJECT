const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String, // e.g. "Section A + Section B"
      required: [true, 'Group name is required'],
      trim: true,
      unique: true,
    },
  },
  { timestamps: true }
);

const Group = mongoose.models.Group || mongoose.model('Group', groupSchema);

module.exports = Group;