const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      trim: true,
    },
    userEmail: {
      type: String,
      trim: true,
    },
    details: {
      type: String,
      trim: true,
      default: 'I am claiming this item as its rightful owner.',
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Approved',
    },
    claimedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const lostFoundItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Item title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: ['lost', 'found'],
      default: 'lost',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      default: 'General',
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    image: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['Unclaimed', 'Claim Pending', 'Claimed', 'Returned', 'open', 'resolved'],
      default: 'Unclaimed',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorName: {
      type: String,
      trim: true,
      default: 'Student',
    },
    contactInfo: {
      type: String,
      trim: true,
      default: '',
    },
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    claimantName: {
      type: String,
      default: null,
    },
    claims: [claimSchema],
    returnedAt: {
      type: Date,
      default: null,
    },
    returnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

lostFoundItemSchema.index({ title: 'text', description: 'text', location: 'text', category: 'text' });

const LostFoundItem = mongoose.models.LostFoundItem || mongoose.model('LostFoundItem', lostFoundItemSchema);

module.exports = LostFoundItem;