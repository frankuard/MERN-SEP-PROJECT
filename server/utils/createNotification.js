const Notification = require('../models/Notification');
const User = require('../models/User');

/*
  Optional real-time push: if server/socket/socketHandler.js exports a way to get
  the io instance (e.g. `module.exports.getIO = () => io`), we'll emit a
  'notification:new' event to that user's socket room the moment a notification
  is created, so NotificationBell.jsx can update instantly instead of waiting on
  the next poll.

  This is wrapped so it silently does nothing if that export doesn't exist yet —
  nothing here breaks if you haven't wired sockets for this feature. When you're
  ready to add real-time delivery, just make sure socketHandler.js does something
  like:
    let io;
    function init(server) { io = new Server(server, ...); ... }
    function getIO() { return io; }
    module.exports = { init, getIO };
  and has each socket join a room named after the user's id on connection
  (socket.join(userId)) so io.to(userId).emit(...) reaches the right person.
*/
let getIO = null;
try {
  // eslint-disable-next-line global-require
  const socketHandler = require('../socket/socketHandler');
  if (typeof socketHandler.getIO === 'function') {
    getIO = socketHandler.getIO;
  }
} catch (err) {
  // socketHandler.js doesn't exist or doesn't export getIO — that's fine, DB-only for now.
}

const emitToUser = (userId, notification) => {
  if (!getIO) return;
  try {
    const io = getIO();
    if (io) io.to(String(userId)).emit('notification:new', notification);
  } catch (err) {
    console.error('Failed to emit real-time notification (non-fatal):', err.message);
  }
};

/**
 * Create a single notification for one user.
 * Never throws — a notification failure should never break the action that
 * triggered it (e.g. don't fail an announcement post because a notification
 * insert failed). Errors are logged and swallowed.
 *
 * @param {string} recipientId - User _id to notify
 * @param {object} payload
 * @param {string} payload.type - one of Notification.NOTIFICATION_TYPES
 * @param {string} payload.title
 * @param {string} payload.message
 * @param {string} [payload.link]
 * @param {object} [payload.meta]
 */
const createNotification = async (recipientId, { type, title, message, link = '', meta = {} }) => {
  if (!recipientId) return null;
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      type,
      title,
      message,
      link,
      meta,
    });
    emitToUser(recipientId, notification);
    return notification;
  } catch (err) {
    console.error(`Failed to create notification (type: ${type}) for user ${recipientId}:`, err.message);
    return null;
  }
};

/**
 * Create the same notification for a list of specific users at once.
 * Useful when you already have the recipient list (e.g. everyone who borrowed a book).
 */
const createNotificationForUsers = async (recipientIds = [], { type, title, message, link = '', meta = {} }) => {
  const ids = [...new Set((recipientIds || []).filter(Boolean).map(String))];
  if (ids.length === 0) return [];

  try {
    const docs = ids.map((recipient) => ({ recipient, type, title, message, link, meta }));
    const created = await Notification.insertMany(docs);
    created.forEach((n) => emitToUser(n.recipient, n));
    return created;
  } catch (err) {
    console.error(`Failed to bulk-create notifications (type: ${type}):`, err.message);
    return [];
  }
};

/**
 * Broadcast a notification to everyone with a given role (or roles).
 * This is what "notify all students" / "notify all teachers" triggers use —
 * announcements, new events, new volunteer opportunities, etc.
 *
 * @param {string|string[]} roles - e.g. 'student' or ['student', 'teacher']
 * @param {object} payload - same shape as createNotification's payload
 * @param {string} [excludeUserId] - skip this user (e.g. don't notify the admin who posted it)
 */
const createNotificationForRole = async (roles, { type, title, message, link = '', meta = {} }, excludeUserId = null) => {
  try {
    const roleList = Array.isArray(roles) ? roles : [roles];
    const filter = { role: { $in: roleList } };
    if (excludeUserId) filter._id = { $ne: excludeUserId };

    const users = await User.find(filter).select('_id');
    const ids = users.map((u) => u._id.toString());
    return await createNotificationForUsers(ids, { type, title, message, link, meta });
  } catch (err) {
    console.error(`Failed to broadcast notification to role(s) ${roles}:`, err.message);
    return [];
  }
};

module.exports = {
  createNotification,
  createNotificationForUsers,
  createNotificationForRole,
};