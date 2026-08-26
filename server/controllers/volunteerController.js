const VolunteerRecord = require('../models/VolunteerRecord');
const Event = require('../models/Event');

// ========================================================
// STUDENT
// ========================================================

const getMyVolunteerHistory = async (req, res) => {
  try {
    const records = await VolunteerRecord.find({ student: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ========================================================
// ADMIN
// ========================================================

const getAllVolunteerRecordsAdmin = async (req, res) => {
  try {
    const filter = {};
    if (req.query.studentId) filter.student = req.query.studentId;

    const records = await VolunteerRecord.find(filter)
      .populate('student', 'username email')
      .populate('event', 'title date')
      .sort({ createdAt: -1 });
    res.status(200).json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createVolunteerRecord = async (req, res) => {
  try {
    const { studentId, eventId, role, date, hours } = req.body;

    if (!studentId || !eventId || !role || !date || hours === undefined) {
      return res.status(400).json({ message: 'studentId, eventId, role, date, and hours are required' });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const record = await VolunteerRecord.create({
      student: studentId,
      event: event._id,
      eventTitle: event.title,
      role: role.trim(),
      date: date.trim(),
      hours: Number(hours),
      verifiedBy: req.user._id,
    });

    res.status(201).json(record);
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

const updateVolunteerRecord = async (req, res) => {
  try {
    const record = await VolunteerRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Volunteer record not found' });

    const { role, date, hours } = req.body;
    if (role !== undefined) record.role = role.trim();
    if (date !== undefined) record.date = date.trim();
    if (hours !== undefined) record.hours = Number(hours);

    const updated = await record.save();
    res.status(200).json(updated);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid record ID' });
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

const deleteVolunteerRecord = async (req, res) => {
  try {
    const record = await VolunteerRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Volunteer record not found' });

    await record.deleteOne();
    res.status(200).json({ message: 'Volunteer record deleted' });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid record ID' });
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getMyVolunteerHistory,
  getAllVolunteerRecordsAdmin,
  createVolunteerRecord,
  updateVolunteerRecord,
  deleteVolunteerRecord,
};