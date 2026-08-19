const mongoose = require('mongoose');

const cctvRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      trim: true,
      default: 'Student',
    },
    userEmail: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Incident location / camera zone is required'],
      trim: true,
    },
    date: {
      type: String,
      required: [true, 'Incident date is required'],
      trim: true,
    },
    timeFrom: {
      type: String,
      required: [true, 'Start time is required'],
      trim: true,
    },
    timeTo: {
      type: String,
      required: [true, 'End time is required'],
      trim: true,
    },
    reason: {
      type: String,
      required: [true, 'Reason and item details are required'],
      trim: true,
    },
    relatedLostItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LostFoundItem',
      default: null,
    },
    additionalDetails: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Pending', 'In Review', 'Approved', 'Rejected', 'Completed'],
      default: 'In Review',
    },
    reviewNotes: {
      type: String,
      trim: true,
      default: '',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    submittedAt: {
      type: String,
      default: 'Just now',
    },
  },
  {
    timestamps: true,
  }
);

const CctvRequest = mongoose.models.CctvRequest || mongoose.model('CctvRequest', cctvRequestSchema);

module.exports = CctvRequest;
