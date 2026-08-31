const mongoose = require('mongoose');

const groupInviteSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    invitedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

groupInviteSchema.index({ conversation: 1, invitedUser: 1 });
groupInviteSchema.index({ invitedUser: 1, status: 1 });

const GroupInvite = mongoose.models.GroupInvite || mongoose.model('GroupInvite', groupInviteSchema);

module.exports = GroupInvite;