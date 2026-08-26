const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student is required'],
    },
    date: {
      type: String, // display string, e.g. "Aug 24, 2026" — matches rest of the app's date style
      required: [true, 'Date is required'],
      trim: true,
    },
    time: {
      type: String, // e.g. "10:00 AM"
      trim: true,
      default: '',
    },
    room: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Present', 'Absent'],
      required: true,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // admin/teacher who marked it
    },
  },
  { timestamps: true }
);

const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;