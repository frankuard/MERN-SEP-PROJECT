const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    foodItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CanteenMenu',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const canteenOrderSchema = new mongoose.Schema(
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
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (v) => v && v.length > 0,
        message: 'Order must contain at least one item',
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    tableNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 9,
    },
    paymentMethod: {
      type: String,
      enum: ['Credit Due', 'Pay at Counter'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Paid'],
      default: 'Pending',
    },
    orderStatus: {
      type: String,
      enum: ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    creditRequestStatus: {
      type: String,
      enum: ['None', 'Pending', 'Approved', 'Rejected'],
      default: 'None',
    },
  },
  { timestamps: true }
);

canteenOrderSchema.index({ createdAt: -1 });
canteenOrderSchema.index({ user: 1, createdAt: -1 });

const CanteenOrder =
  mongoose.models.CanteenOrder || mongoose.model('CanteenOrder', canteenOrderSchema);

module.exports = CanteenOrder;
