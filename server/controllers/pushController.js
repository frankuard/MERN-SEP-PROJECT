const webPush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

// Configure VAPID once when this module loads
webPush.setVapidDetails(
  process.env.VAPID_EMAIL   || 'mailto:admin@chautari.edu.np',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const resolveUserId = (req) => req.user?._id || req.user?.userId;

// GET /api/push/vapid-public-key
// Returns the public VAPID key so the browser can subscribe
const getVapidPublicKey = (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};

// POST /api/push/subscribe   body: { endpoint, keys: { p256dh, auth } }
const subscribe = async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ message: 'endpoint and keys (p256dh, auth) are required' });
    }

    const userId = resolveUserId(req);

    // Upsert — if the same endpoint re-subscribes, update it
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { user: userId, endpoint, keys },
      { upsert: true, new: true }
    );

    res.status(201).json({ message: 'Subscribed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/push/unsubscribe   body: { endpoint }
const unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ message: 'endpoint is required' });

    await PushSubscription.deleteOne({ endpoint });
    res.json({ message: 'Unsubscribed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
//  Internal helper — called from createNotification utility.
//  Sends a push to every saved subscription for a given userId.
//  Never throws — a push failure must never break the main action.
// ─────────────────────────────────────────────────────────────
const sendPushToUser = async (userId, { title, message, link = '' }) => {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;

  try {
    const subscriptions = await PushSubscription.find({ user: userId }).lean();
    if (!subscriptions.length) return;

    const payload = JSON.stringify({ title, body: message, link });

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webPush.sendNotification(
            { endpoint: sub.endpoint, keys: sub.keys },
            payload
          );
        } catch (err) {
          // 410 Gone = subscription expired/revoked — clean it up
          if (err.statusCode === 410) {
            await PushSubscription.deleteOne({ endpoint: sub.endpoint }).catch(() => {});
          }
        }
      })
    );
  } catch (err) {
    console.error('[WebPush] sendPushToUser error (non-fatal):', err.message);
  }
};

module.exports = { getVapidPublicKey, subscribe, unsubscribe, sendPushToUser };
