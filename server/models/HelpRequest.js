const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    name: { type: String, default: 'attachment' },
  },
  { _id: false }
);

const responseSchema = new mongoose.Schema(
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
    message: {
      type: String,
      required: [true, 'Response message is required'],
      trim: true,
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const helpRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requesterName: {
      type: String,
      trim: true,
      default: 'Student',
    },
    requesterSem: {
      type: String,
      trim: true,
      default: 'Student',
    },
    request: {
      type: String,
      required: [true, 'Request text is required'],
      trim: true,
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    responses: [responseSchema],
  },
  { timestamps: true }
);

const HelpRequest = mongoose.models.HelpRequest || mongoose.model('HelpRequest', helpRequestSchema);

module.exports = HelpRequest;