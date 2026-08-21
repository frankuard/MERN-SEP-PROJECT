const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      required: [true, 'Day is required'],
      enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      trim: true,
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      trim: true,
    },
    courseCode: {
      type: String,
      required: [true, 'Course code is required'],
      trim: true,
      uppercase: true,
    },
    courseName: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
    },
    teacher: {
      type: String,
      required: [true, 'Teacher name is required'],
      trim: true,
    },
    room: {
      type: String,
      required: [true, 'Room is required'],
      trim: true,
    },
    classType: {
      type: String,
      required: [true, 'Class type is required'],
      enum: ['Lecture', 'Tutorial', 'Workshop'],
      default: 'Lecture',
    },
  },
  { timestamps: true }
);

const Timetable = mongoose.models.Timetable || mongoose.model('Timetable', timetableSchema);

module.exports = Timetable;
