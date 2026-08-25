const mongoose = require('mongoose');

const DAY_ENUM = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const classroomRequestSchema = new mongoose.Schema(
  {
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      required: [true, 'Classroom is required'],
    },
    roomName: { type: String, required: true, trim: true }, // snapshot for display

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requesting user is required'],
    },
    requesterName: { type: String, required: true, trim: true }, // snapshot for admin list

    day: {
      type: String,
      enum: DAY_ENUM,
      required: [true, 'Day is required'],
    },
    startTime: { type: String, required: [true, 'Start time is required'], trim: true },
    endTime: { type: String, required: [true, 'End time is required'], trim: true },

    reason: {
      type: String,
      trim: true,
      default: '',
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewNote: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

const ClassroomRequest = mongoose.models.ClassroomRequest || mongoose.model('ClassroomRequest', classroomRequestSchema);

module.exports = ClassroomRequest;