const mongoose = require('mongoose');

const friendRequestSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Speeds up "is there already a request between these two people" checks,
// which are done in both directions in the controller (not enforced as a
// unique index here, since a rejected request should be re-requestable).
friendRequestSchema.index({ requester: 1, recipient: 1 });
friendRequestSchema.index({ recipient: 1, requester: 1 });

const FriendRequest =
  mongoose.models.FriendRequest || mongoose.model('FriendRequest', friendRequestSchema);

module.exports = FriendRequest;