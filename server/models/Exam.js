const mongoose = require('mongoose');

const EXAM_TYPES = ['Midterm', 'Final', 'Quiz', 'Practical', 'Assignment', 'Presentation'];

const examSchema = new mongoose.Schema(
  {
    // Free-text module name so admin is not forced to link a Module doc
    moduleName: {
      type: String,
      required: [true, 'Module name is required'],
      trim: true,
    },
    // Optional link to the Module master (used for moduleCode snapshot)
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      default: null,
    },
    moduleCode: {
      type: String,
      trim: true,
      default: '',
    },
    // Optional group / section info
    group: {
      type: String,
      trim: true,
      default: '',
    },
    examType: {
      type: String,
      enum: EXAM_TYPES,
      required: [true, 'Exam type is required'],
    },
    // ISO date string stored as Date for reliable "upcoming" filtering
    date: {
      type: Date,
      required: [true, 'Exam date is required'],
    },
    startTime: {
      type: String, // e.g. "10:00 AM"
      required: [true, 'Start time is required'],
      trim: true,
    },
    endTime: {
      type: String, // e.g. "12:00 PM"
      required: [true, 'End time is required'],
      trim: true,
    },
    // Venue / room
    room: {
      type: String,
      required: [true, 'Room / venue is required'],
      trim: true,
    },
    // Optional additional info shown on the student card
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    // Soft-delete: admin can hide an exam without destroying the record
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for the most common student query: upcoming active exams sorted by date
examSchema.index({ isActive: 1, date: 1 });

const Exam = mongoose.models.Exam || mongoose.model('Exam', examSchema);

module.exports = Exam;
module.exports.EXAM_TYPES = EXAM_TYPES;
