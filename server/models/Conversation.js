const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    isGroup: {
      type: Boolean,
      default: false,
    },

    // Group-only fields — ignored/empty for DMs
    groupName: {
      type: String,
      trim: true,
      default: '',
    },
    groupIcon: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null for DMs
    },

    // Every conversation (DM or group) just has a list of participants.
    // For a DM this is always exactly 2 users.
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],

    // Denormalized last message, so the conversation list can render
    // previews without a separate query per conversation.
    lastMessage: {
      text: { type: String, default: '' },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      sentAt: { type: Date, default: null },
    },

    // Users who "deleted" this conversation from their own inbox. DM-only
    // concept — the conversation and its messages still exist; it's just
    // hidden from this user's list. If the other participant sends a new
    // message, their ID is removed from here (see sendMessage) so it
    // reappears automatically. Groups don't use this — leaving a group
    // removes you from `participants` instead, and deleting a group (as
    // creator) destroys it outright.
    deletedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

// Speeds up "find all conversations this user is part of" — the main
// query used to build the conversation list.
conversationSchema.index({ participants: 1 });

const Conversation =
  mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;