const mongoose = require('mongoose');

const paymentRecordSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: [1, 'Payment amount must be greater than zero'],
    },
    method: {
      type: String,
      enum: ['Cash', 'Online QR', 'Bank Transfer'],
      default: 'Cash',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { _id: true }
);

const canteenCreditSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User / Student reference is required'],
    },
    studentName: {
      type: String,
      trim: true,
      default: '',
    },
    amountDue: {
      type: Number,
      default: 0,
      min: [0, 'Amount due cannot be negative'],
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: [0, 'Amount paid cannot be negative'],
    },
    remainingBalance: {
      type: Number,
      default: 0,
      min: [0, 'Remaining balance cannot be negative'],
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Partially Paid', 'Cleared'],
      default: 'Pending',
    },
    paymentHistory: [paymentRecordSchema],
  },
  { timestamps: true }
);

// Auto-calculate remaining balance and payment status before saving
canteenCreditSchema.pre('save', function (next) {
  this.remainingBalance = Math.max(0, this.amountDue - this.amountPaid);
  if (this.remainingBalance === 0 && this.amountDue > 0) {
    this.paymentStatus = 'Cleared';
  } else if (this.amountPaid > 0 && this.remainingBalance > 0) {
    this.paymentStatus = 'Partially Paid';
  } else {
    this.paymentStatus = 'Pending';
  }
  next();
});

const CanteenCredit = mongoose.models.CanteenCredit || mongoose.model('CanteenCredit', canteenCreditSchema);

module.exports = CanteenCredit;
