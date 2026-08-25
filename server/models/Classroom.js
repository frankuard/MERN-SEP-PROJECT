const mongoose = require('mongoose');

const manualBlockSchema = new mongoose.Schema(
  {
    day: { type: String, required: true },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
    reason: { type: String, trim: true, default: '' },
    createdBy: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

const classroomSchema = new mongoose.Schema(
  {
    name: {
      type: String, // e.g. "LT-01 Wulfurna"
      required: [true, 'Room name is required'],
      trim: true,
      unique: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: 1,
    },
    facilities: {
      type: String, // e.g. "Projector, AC, Whiteboard"
      trim: true,
      default: '',
    },
    manualBlocks: {
      type: [manualBlockSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const Classroom = mongoose.models.Classroom || mongoose.model('Classroom', classroomSchema);

module.exports = Classroom;