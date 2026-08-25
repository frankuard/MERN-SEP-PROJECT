const Timetable = require('../models/Timetable');
const ScheduleChange = require('../models/ScheduleChange');
const Module = require('../models/Module');
const Group = require('../models/Group');
const Classroom = require('../models/Classroom');

const DAY_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ========================================================
// STUDENT — Timetable
// ========================================================

const getTimetable = async (req, res) => {
  try {
    const periods = await Timetable.find({}).sort({ day: 1, order: 1, startTime: 1 });

    const grouped = DAY_ORDER.map((day) => {
      const dayPeriods = periods
        .filter((p) => p.day === day)
        .map((p) => ({
          id: p._id,
          startTime: p.startTime,
          endTime: p.endTime,
          classType: p.classType,
          moduleCode: p.moduleCode,
          moduleName: p.moduleName,
          lecturer: p.lecturer,
          group: p.groupName,
          room: p.roomName,
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

const getTimetableAdmin = async (req, res) => {
  try {
    const periods = await Timetable.find({}).sort({ day: 1, order: 1, startTime: 1 });
    res.status(200).json(periods);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createPeriod = async (req, res) => {
  try {
    const { day, startTime, endTime, classType, moduleId, lecturer, groupId, roomId, order } = req.body;

    if (!day || !startTime || !endTime || !classType || !moduleId || !lecturer || !roomId) {
      return res.status(400).json({
        message: 'day, startTime, endTime, classType, moduleId, lecturer, and roomId are required',
      });
    }

    const moduleDoc = await Module.findById(moduleId);
    if (!moduleDoc) return res.status(404).json({ message: 'Module not found' });

    const roomDoc = await Classroom.findById(roomId);
    if (!roomDoc) return res.status(404).json({ message: 'Classroom not found' });

    let groupDoc = null;
    if (groupId) {
      groupDoc = await Group.findById(groupId);
      if (!groupDoc) return res.status(404).json({ message: 'Group not found' });
    }

    const period = await Timetable.create({
      day,
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      classType,
      module: moduleDoc._id,
      moduleCode: moduleDoc.code,
      moduleName: moduleDoc.name,
      lecturer: lecturer.trim(),
      group: groupDoc?._id || null,
      groupName: groupDoc?.name || '',
      room: roomDoc._id,
      roomName: roomDoc.name,
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

    const { day, startTime, endTime, classType, moduleId, lecturer, groupId, roomId, order } = req.body;

    if (day !== undefined) period.day = day;
    if (startTime !== undefined) period.startTime = startTime.trim();
    if (endTime !== undefined) period.endTime = endTime.trim();
    if (classType !== undefined) period.classType = classType;
    if (lecturer !== undefined) period.lecturer = lecturer.trim();
    if (order !== undefined) period.order = Number(order);

    if (moduleId !== undefined) {
      const moduleDoc = await Module.findById(moduleId);
      if (!moduleDoc) return res.status(404).json({ message: 'Module not found' });
      period.module = moduleDoc._id;
      period.moduleCode = moduleDoc.code;
      period.moduleName = moduleDoc.name;
    }

    if (roomId !== undefined) {
      const roomDoc = await Classroom.findById(roomId);
      if (!roomDoc) return res.status(404).json({ message: 'Classroom not found' });
      period.room = roomDoc._id;
      period.roomName = roomDoc.name;
    }

    if (groupId !== undefined) {
      if (groupId === null || groupId === '') {
        period.group = null;
        period.groupName = '';
      } else {
        const groupDoc = await Group.findById(groupId);
        if (!groupDoc) return res.status(404).json({ message: 'Group not found' });
        period.group = groupDoc._id;
        period.groupName = groupDoc.name;
      }
    }

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
      periodId, newDay, newStartTime, newEndTime, newRoom,
      reason, effectiveDate, publishedBy, status, badgeColor,
    } = req.body;

    if (!periodId || !effectiveDate || !status) {
      return res.status(400).json({ message: 'periodId, effectiveDate, and status are required' });
    }

    const period = await Timetable.findById(periodId);
    if (!period) return res.status(404).json({ message: 'Original period not found' });

    const change = await ScheduleChange.create({
      period: period._id,
      moduleCode: period.moduleCode,
      moduleName: period.moduleName,
      classType: period.classType,
      group: period.groupName,
      originalDay: period.day,
      originalStartTime: period.startTime,
      originalEndTime: period.endTime,
      originalRoom: period.roomName,

      newDay: newDay?.trim() || '',
      newStartTime: newStartTime?.trim() || '',
      newEndTime: newEndTime?.trim() || '',
      newRoom: newRoom?.trim() || '',

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
      'newDay', 'newStartTime', 'newEndTime', 'newRoom',
      'reason', 'effectiveDate', 'publishedBy', 'status', 'badgeColor', 'isActive',
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
  getTimetable,
  getScheduleChanges,
  getTimetableAdmin,
  createPeriod,
  updatePeriod,
  deletePeriod,
  getScheduleChangesAdmin,
  createScheduleChange,
  updateScheduleChange,
  deleteScheduleChange,
};