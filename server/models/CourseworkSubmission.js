const mongoose = require('mongoose');

const submissionAttachmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    fileType: { type: String, default: '' },
    size: { type: Number, default: 0 },
  },
  { _id: false }
);

const courseworkSubmissionSchema = new mongoose.Schema(
  {
    coursework: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coursework',
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    studentEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    studentGroup: {
      type: String,
      trim: true,
      default: '',
    },
    submissionText: {
      type: String,
      default: '',
      trim: true,
    },
    attachments: {
      type: [submissionAttachmentSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['submitted', 'graded', 'late'],
      default: 'submitted',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    grade: {
      type: Number,
      default: null,
    },
    feedback: {
      type: String,
      default: '',
      trim: true,
    },
    gradedAt: {
      type: Date,
      default: null,
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// Enforce unique submission per student per coursework
courseworkSubmissionSchema.index({ coursework: 1, student: 1 }, { unique: true });

const CourseworkSubmission =
  mongoose.models.CourseworkSubmission ||
  mongoose.model('CourseworkSubmission', courseworkSubmissionSchema);

module.exports = CourseworkSubmission;
