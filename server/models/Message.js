const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      trim: true,
      default: '',
    },

    // Which participants have read this message — lets the frontend show
    // "seen" state without a separate read-tracking collection.
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // Optional file attachment (image or document), uploaded separately via
    // POST /api/upload/document, then its URL/name/type passed in here.
    attachment: {
      url: { type: String, default: null },
      name: { type: String, default: null },
      mimetype: { type: String, default: null },
    },
  },
  { timestamps: true }
);

// Powers "give me this conversation's messages, newest last" (or paginate backwards).
messageSchema.index({ conversation: 1, createdAt: 1 });

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

module.exports = Message;