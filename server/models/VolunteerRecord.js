const mongoose = require('mongoose');

const volunteerRecordSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student is required'],
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event is required'],
    },
    eventTitle: { type: String, required: true, trim: true }, // snapshot, in case the event is later edited/deleted
    role: {
      type: String, // e.g. "Registration Desk", "Setup Crew"
      required: [true, 'Role is required'],
      trim: true,
    },
    date: {
      type: String, // display string, e.g. "Aug 24, 2026"
      required: [true, 'Date is required'],
      trim: true,
    },
    hours: {
      type: Number,
      required: [true, 'Hours is required'],
      min: 0,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Verifying admin/staff is required'],
    },
  },
  { timestamps: true }
);

const VolunteerRecord = mongoose.models.VolunteerRecord || mongoose.model('VolunteerRecord', volunteerRecordSchema);

module.exports = VolunteerRecord;