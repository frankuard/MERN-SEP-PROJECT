const Timetable = require('../models/Timetable');
const ScheduleChange = require('../models/ScheduleChange');

const DAY_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ========================================================
// STUDENT — Timetable
// ========================================================

/**
 * GET /timetable
 * Returns periods grouped by day, in DAY_ORDER, with isOffDay computed.
 */
const getTimetable = async (req, res) => {
  try {
    const periods = await Timetable.find({}).sort({ day: 1, order: 1, time: 1 });

    const grouped = DAY_ORDER.map((day) => {
      const dayPeriods = periods
        .filter((p) => p.day === day)
        .map((p) => ({
          id: p._id,
          time: p.time,
          classType: p.classType,
          moduleCode: p.moduleCode,
          moduleName: p.moduleName,
          lecturer: p.lecturer,
          group: p.group,
          room: p.room,
        }));

      return {
        day,
        isOffDay: dayPeriods.length === 0,
        periods: dayPeriods,
      };
    });

    res.status(200).json(grouped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /timetable/changes
 * Returns active schedule changes only, newest first.
 */
const getScheduleChanges = async (req, res) => {
  try {
    const changes = await ScheduleChange.find({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json(changes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ========================================================
// ADMIN — Timetable Periods
// ========================================================

/**
 * GET /timetable/admin
 * Flat list (not grouped) so the admin UI can edit individual periods.
 */
const getTimetableAdmin = async (req, res) => {
  try {
    const periods = await Timetable.find({}).sort({ day: 1, order: 1, time: 1 });
    res.status(200).json(periods);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createPeriod = async (req, res) => {
  try {
    const { day, time, classType, moduleCode, moduleName, lecturer, group, room, order } = req.body;

    if (!day || !time || !classType || !moduleCode || !moduleName || !lecturer || !room) {
      return res.status(400).json({
        message: 'day, time, classType, moduleCode, moduleName, lecturer, and room are required',
      });
    }

    const period = await Timetable.create({
      day,
      time: time.trim(),
      classType,
      moduleCode: moduleCode.trim(),
      moduleName: moduleName.trim(),
      lecturer: lecturer.trim(),
      group: group?.trim() || '',
      room: room.trim(),
      order: order != null ? Number(order) : 0,
    });

    res.status(201).json(period);
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

const updatePeriod = async (req, res) => {
  try {
    const period = await Timetable.findById(req.params.id);
    if (!period) return res.status(404).json({ message: 'Period not found' });

    const allowedFields = ['day', 'time', 'classType', 'moduleCode', 'moduleName', 'lecturer', 'group', 'room', 'order'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) period[field] = req.body[field];
    });

    const updated = await period.save();
    res.status(200).json(updated);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid period ID' });
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

const deletePeriod = async (req, res) => {
  try {
    const period = await Timetable.findById(req.params.id);
    if (!period) return res.status(404).json({ message: 'Period not found' });

    await period.deleteOne();
    res.status(200).json({ message: 'Period deleted' });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid period ID' });
    res.status(500).json({ message: err.message });
  }
};

// ========================================================
// ADMIN — Schedule Changes
// ========================================================

/**
 * GET /timetable/changes/admin
 * All changes including archived (isActive: false), for management view.
 */
const getScheduleChangesAdmin = async (req, res) => {
  try {
    const changes = await ScheduleChange.find({}).sort({ createdAt: -1 });
    res.status(200).json(changes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createScheduleChange = async (req, res) => {
  try {
    const {
      moduleCode, moduleName, classType, group,
      originalSchedule, newSchedule, reason,
      effectiveDate, publishedBy, status, badgeColor,
    } = req.body;

    if (!moduleCode || !moduleName || !classType || !originalSchedule || !newSchedule || !effectiveDate || !status) {
      return res.status(400).json({
        message: 'moduleCode, moduleName, classType, originalSchedule, newSchedule, effectiveDate, and status are required',
      });
    }

    const change = await ScheduleChange.create({
      moduleCode: moduleCode.trim(),
      moduleName: moduleName.trim(),
      classType,
      group: group?.trim() || '',
      originalSchedule: originalSchedule.trim(),
      newSchedule: newSchedule.trim(),
      reason: reason?.trim() || '',
      effectiveDate: effectiveDate.trim(),
      publishedBy: publishedBy?.trim() || 'RTE Department (Registry & Timetabling)',
      status,
      badgeColor: badgeColor || 'amber',
    });

    res.status(201).json(change);
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

const updateScheduleChange = async (req, res) => {
  try {
    const change = await ScheduleChange.findById(req.params.id);
    if (!change) return res.status(404).json({ message: 'Schedule change not found' });

    const allowedFields = [
      'moduleCode', 'moduleName', 'classType', 'group',
      'originalSchedule', 'newSchedule', 'reason',
      'effectiveDate', 'publishedBy', 'status', 'badgeColor', 'isActive',
    ];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) change[field] = req.body[field];
    });

    const updated = await change.save();
    res.status(200).json(updated);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid schedule change ID' });
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

const deleteScheduleChange = async (req, res) => {
  try {
    const change = await ScheduleChange.findById(req.params.id);
    if (!change) return res.status(404).json({ message: 'Schedule change not found' });

    await change.deleteOne();
    res.status(200).json({ message: 'Schedule change deleted' });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid schedule change ID' });
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  // Student
  getTimetable,
  getScheduleChanges,
  // Admin — periods
  getTimetableAdmin,
  createPeriod,
  updatePeriod,
  deletePeriod,
  // Admin — schedule changes
  getScheduleChangesAdmin,
  createScheduleChange,
  updateScheduleChange,
  deleteScheduleChange,
};