const Announcement = require('../models/Announcement');

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

module.exports = {
  getAnnouncements,
  getAnnouncementById,
};