const mongoose = require('mongoose');

const borrowRequestSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    studentIdNumber: {
      type: String,
      required: [true, 'Student ID number is required'],
      trim: true,
    },
    returnBy: {
      type: Date,
      required: [true, 'Return date is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'returned'],
      default: 'pending',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    returnedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const BorrowRequest = mongoose.models.BorrowRequest || mongoose.model('BorrowRequest', borrowRequestSchema);

module.exports = BorrowRequest;