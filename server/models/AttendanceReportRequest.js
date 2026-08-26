const mongoose = require('mongoose');

const attendanceReportRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student is required'],
    },
    studentName: { type: String, required: true, trim: true }, // snapshot for admin list
    reason: {
      type: String, // e.g. "Scholarship renewal", "Visa verification"
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'fulfilled', 'rejected'],
      default: 'pending',
    },
    adminNote: {
      type: String,
      trim: true,
      default: '',
    },
    reportFileUrl: {
      type: String, // link to the generated/uploaded report once fulfilled
      trim: true,
      default: '',
    },
    fulfilledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

const AttendanceReportRequest =
  mongoose.models.AttendanceReportRequest ||
  mongoose.model('AttendanceReportRequest', attendanceReportRequestSchema);

module.exports = AttendanceReportRequest;