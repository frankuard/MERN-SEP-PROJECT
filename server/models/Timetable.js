const mongoose = require('mongoose');

const DAY_ENUM = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const timetableSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: DAY_ENUM,
      required: [true, 'Day is required'],
    },
    time: {
      type: String,
      required: [true, 'Time slot is required'],
      trim: true,
    },
    classType: {
      type: String,
      enum: ['Lecture', 'Tutorial', 'Workshop'],
      required: [true, 'Class type is required'],
    },
    moduleCode: {
      type: String,
      required: [true, 'Module code is required'],
      trim: true,
    },
    moduleName: {
      type: String,
      required: [true, 'Module name is required'],
      trim: true,
    },
    lecturer: {
      type: String,
      required: [true, 'Lecturer is required'],
      trim: true,
    },
    group: {
      type: String,
      trim: true,
      default: '',
    },
    room: {
      type: String,
      required: [true, 'Room is required'],
      trim: true,
    },
    order: {
      type: Number,
      default: 0, // controls sort order within a day when times overlap alphabetically
    },
  },
  { timestamps: true }
);

timetableSchema.index({ day: 1, order: 1 });

const Timetable = mongoose.models.Timetable || mongoose.model('Timetable', timetableSchema);

module.exports = Timetable;
module.exports.DAY_ENUM = DAY_ENUM;