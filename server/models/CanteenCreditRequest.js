const mongoose = require('mongoose');

const canteenCreditRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userRole: {
      type: String,
      enum: ['student', 'teacher'],
      required: true,
    },
    userName: {
      type: String,
      default: '',
      trim: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CanteenOrder',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    adminNote: {
      type: String,
      default: '',
      trim: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

canteenCreditRequestSchema.index({ status: 1, createdAt: -1 });
canteenCreditRequestSchema.index({ user: 1, createdAt: -1 });

const CanteenCreditRequest =
  mongoose.models.CanteenCreditRequest ||
  mongoose.model('CanteenCreditRequest', canteenCreditRequestSchema);

module.exports = CanteenCreditRequest;
