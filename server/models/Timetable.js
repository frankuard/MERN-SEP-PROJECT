const mongoose = require('mongoose');

const DAY_ENUM = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const timetableSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: DAY_ENUM,
      required: [true, 'Day is required'],
    },
    startTime: {
      type: String, // e.g. "8:00 AM"
      required: [true, 'Start time is required'],
      trim: true,
    },
    endTime: {
      type: String, // e.g. "10:00 AM"
      required: [true, 'End time is required'],
      trim: true,
    },
    classType: {
      type: String,
      enum: ['Lecture', 'Tutorial', 'Workshop'],
      required: [true, 'Class type is required'],
    },

    // Linked to the Module master list so code/name always match.
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: [true, 'Module is required'],
    },
    moduleCode: { type: String, required: true, trim: true }, // snapshot, kept for fast reads
    moduleName: { type: String, required: true, trim: true },

    lecturer: {
      type: String,
      required: [true, 'Lecturer is required'],
      trim: true,
    },

    // Linked to the Group master list — a period can span several groups
    // at once (e.g. "L4CG1 + L4CG2 + L4CG4" running together as one lecture).
    groups: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
      default: [],
    },
    groupNames: { type: [String], default: [] }, // snapshot

    // Linked to the Classroom master list.
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      required: [true, 'Room is required'],
    },
    roomName: { type: String, required: true, trim: true }, // snapshot

    order: {
      type: Number,
      default: 0, // controls card order within a day when times overlap/tie
    },

    // Academic level (e.g. 4 for Level 4, 5 for Level 5, 6 for Level 6)
    level: {
      type: Number,
      enum: [3, 4, 5, 6, 7, 8],
      default: 4,
    },

    // Specific semester (e.g. 1, 2, 3, 4, 5, 6). If null, covers full level.
    semester: {
      type: Number,
      min: 1,
      max: 8,
      default: null,
    },

    department: {
      type: String,
      default: 'BCS',
      trim: true,
    },
  },
  { timestamps: true }
);

const Timetable = mongoose.models.Timetable || mongoose.model('Timetable', timetableSchema);

module.exports = Timetable;