const Notification = require('../models/Notification');

// GET /api/notifications
// Query params: ?unreadOnly=true, ?limit=20, ?skip=0
// Returns the user's notifications newest-first, plus the total unread count
// (so the frontend can update the bell badge from the same call it uses to open the panel).
const getMyNotifications = async (req, res) => {
  try {
    const { unreadOnly, limit = 30, skip = 0 } = req.query;
    const filter = { recipient: req.user._id };
    if (unreadOnly === 'true') filter.read = false;

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Math.min(Number(limit), 100)),
      Notification.countDocuments({ recipient: req.user._id, read: false }),
    ]);

    res.status(200).json({ notifications, unreadCount });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ message: 'Failed to fetch notifications', error: err.message });
  }
};

// GET /api/notifications/unread-count
// Lightweight endpoint for polling just the badge count without pulling the full list.
const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, read: false });
    res.status(200).json({ unreadCount });
  } catch (err) {
    console.error('Error fetching unread count:', err);
    res.status(500).json({ message: 'Failed to fetch unread count', error: err.message });
  }
};

// PATCH /api/notifications/:id/read
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id }, // scoped to the owner — can't mark someone else's as read
      { $set: { read: true } },
      { new: true }
    );

    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.status(200).json({ notification });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ message: 'Failed to update notification', error: err.message });
  }
};

// PATCH /api/notifications/read-all
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { $set: { read: true } }
    );
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).json({ message: 'Failed to update notifications', error: err.message });
  }
};

// DELETE /api/notifications/:id
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.status(200).json({ message: 'Notification deleted' });
  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).json({ message: 'Failed to delete notification', error: err.message });
  }
};

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};