const Announcement = require('../models/Announcement');
const { createNotificationForRole } = require('../utils/createNotification');
/**
 * 1. Get all announcements (optional department / priority filters)
 * GET /api/announcements
 */
const getAnnouncements = async (req, res) => {
  try {
    const { department, priority } = req.query;
    const filter = {};

    if (department && department !== 'All') filter.department = department;
    if (priority && priority !== 'All') filter.priority = priority;

    const announcements = await Announcement.find(filter).sort({ publishedAt: -1 });

    res.status(200).json(announcements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * 2. Get single announcement by ID
 * GET /api/announcements/:id
 */
const getAnnouncementById = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });

    res.status(200).json(announcement);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid announcement ID' });
    res.status(500).json({ message: err.message });
  }
};

/**
 * 3. Create announcement (admin only)
 * POST /api/announcements
 */
const createAnnouncement = async (req, res) => {
  try {
    const { title, message, priority, department, publishedAt } = req.body;

    if (!title || !department) {
      return res.status(400).json({ message: 'title and department are required' });
    }

        const announcement = await Announcement.create({
      title,
      message,
      priority,
      department,
      publishedAt: publishedAt || Date.now(),
    });

    createNotificationForRole('student', {
      type: 'announcement',
      title: 'New Announcement',
      message: announcement.title,
      link: `/announcements/${announcement._id}`,
    });

    res.status(201).json(announcement);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};

/**
 * 4. Update announcement (admin only)
 * PATCH /api/announcements/:id
 */
const updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });

    const allowedFields = ['title', 'message', 'priority', 'department', 'publishedAt'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        announcement[field] = req.body[field];
      }
    });

        const updated = await announcement.save();

    createNotificationForRole('student', {
      type: 'announcement',
      title: 'Announcement Updated',
      message: updated.title,
      link: `/announcements/${updated._id}`,
    });

    res.status(200).json(updated);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid announcement ID' });
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

/**
 * 5. Delete announcement (admin only)
 * DELETE /api/announcements/:id
 */
const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });

    await announcement.deleteOne();
    res.status(200).json({ message: 'Announcement deleted' });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid announcement ID' });
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};