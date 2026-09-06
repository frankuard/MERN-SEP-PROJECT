const mongoose = require('mongoose');

// Stores one Web Push subscription object per user per device/browser.
// A single user can have multiple subscriptions (phone + laptop + etc.).
const pushSubscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // The full subscription object returned by browser PushManager.subscribe()
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth:   { type: String, required: true },
    },
  },
  { timestamps: true }
);

// Index so we can quickly find all subscriptions for a user
pushSubscriptionSchema.index({ user: 1 });

const PushSubscription =
  mongoose.models.PushSubscription ||
  mongoose.model('PushSubscription', pushSubscriptionSchema);

module.exports = PushSubscription;
