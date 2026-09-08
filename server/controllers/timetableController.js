const Timetable = require('../models/Timetable');
const ScheduleChange = require('../models/ScheduleChange');
const Module = require('../models/Module');
const Group = require('../models/Group');
const Classroom = require('../models/Classroom');
const { createNotificationForRole } = require('../utils/createNotification');
const { emitToAll } = require('../utils/socketEmitter');
const DAY_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ========================================================
// STUDENT — Timetable
// ========================================================

const getTimetable = async (req, res) => {
  try {
    const periods = await Timetable.find({}).sort({ day: 1, order: 1, startTime: 1 });

    // Only show periods that include the logged-in student's own group.
    // Staff/admin/teacher accounts have no group set, so they see everything.
   const studentGroup = req.user?.group || '';

const visiblePeriods = studentGroup
  ? periods.filter((p) => (p.groupNames || []).includes(studentGroup))
  : periods;

    const grouped = DAY_ORDER.map((day) => {
      const dayPeriods = visiblePeriods
        .filter((p) => p.day === day)
        .map((p) => ({
          id: p._id,
          startTime: p.startTime,
          endTime: p.endTime,
          time: `${p.startTime} – ${p.endTime}`,
          classType: p.classType,
          moduleCode: p.moduleCode,
          moduleName: p.moduleName,
          lecturer: p.lecturer,
          group: (p.groupNames || []).join(' + '),
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
    const { day, startTime, endTime, classType, moduleId, lecturer, groupIds, roomId, order } = req.body;

    if (!day || !startTime || !endTime || !classType || !moduleId || !lecturer || !roomId) {
      return res.status(400).json({
        message: 'day, startTime, endTime, classType, moduleId, lecturer, and roomId are required',
      });
    }

    const moduleDoc = await Module.findById(moduleId);
    if (!moduleDoc) return res.status(404).json({ message: 'Module not found' });

    const roomDoc = await Classroom.findById(roomId);
    if (!roomDoc) return res.status(404).json({ message: 'Classroom not found' });

    const groupIdList = Array.isArray(groupIds) ? groupIds.filter(Boolean) : [];
    let groupDocs = [];
    if (groupIdList.length > 0) {
      groupDocs = await Group.find({ _id: { $in: groupIdList } });
      if (groupDocs.length !== groupIdList.length) {
        return res.status(404).json({ message: 'One or more groups not found' });
      }
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
      groups: groupDocs.map((g) => g._id),
      groupNames: groupDocs.map((g) => g.name),
      room: roomDoc._id,
      roomName: roomDoc.name,
      order: order != null ? Number(order) : 0,
    });

    // Broadcast real-time update
    emitToAll('timetable:period:created', { period });

        createNotificationForRole('student', {
      type: 'timetable',
      title: 'New Class Added',
      message: `${period.moduleCode} (${period.classType}) added on ${period.day}, ${period.startTime}–${period.endTime}`,
      link: 'rte',
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

    const { day, startTime, endTime, classType, moduleId, lecturer, groupIds, roomId, order } = req.body;

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

    if (groupIds !== undefined) {
      const groupIdList = Array.isArray(groupIds) ? groupIds.filter(Boolean) : [];
      if (groupIdList.length === 0) {
        period.groups = [];
        period.groupNames = [];
      } else {
        const groupDocs = await Group.find({ _id: { $in: groupIdList } });
        if (groupDocs.length !== groupIdList.length) {
          return res.status(404).json({ message: 'One or more groups not found' });
        }
        period.groups = groupDocs.map((g) => g._id);
        period.groupNames = groupDocs.map((g) => g.name);
      }
    }

    const updated = await period.save();

    // Broadcast real-time update
    emitToAll('timetable:period:updated', { period: updated });

    createNotificationForRole('student', {
      type: 'timetable',
      title: 'Class Period Updated',
      message: `${updated.moduleCode} (${updated.classType}) on ${updated.day} was updated`,
      link: 'rte',
    });

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

    const periodId = period._id;
    await period.deleteOne();

    // Broadcast real-time deletion
    emitToAll('timetable:period:deleted', { _id: periodId });

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

    // Broadcast real-time update
    emitToAll('timetable:change:created', { change });

    createNotificationForRole('student', {
      type: 'timetable',
      title: 'Schedule Change Published',
      message: `${change.moduleCode} — ${change.status} (${change.originalDay})`,
      link: 'rte',
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

    // Broadcast real-time update
    emitToAll('timetable:change:updated', { change: updated });

    createNotificationForRole('student', {
      type: 'timetable',
      title: 'Schedule Change Updated',
      message: `${updated.moduleCode} — ${updated.status} (${updated.originalDay})`,
      link: 'rte',
    });

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

    const changeId = change._id;
    await change.deleteOne();

    // Broadcast real-time deletion
    emitToAll('timetable:change:deleted', { _id: changeId });

    res.status(200).json({ message: 'Schedule change deleted' });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid schedule change ID' });
    res.status(500).json({ message: err.message });
  }
};

// ========================================================
// TEACHER — Upcoming Classes
// Returns periods where lecturer matches the logged-in
// teacher's username, ordered by day then start time.
// ========================================================

const DAY_INDEX = Object.fromEntries(DAY_ORDER.map((d, i) => [d, i]));

const getTeacherUpcomingClasses = async (req, res) => {
  try {
    const lecturerName = req.user?.username || '';
    if (!lecturerName) {
      return res.status(400).json({ message: 'Unable to resolve teacher identity' });
    }

    // Case-insensitive search so minor capitalisation differences don't break it
    const periods = await Timetable.find({
      lecturer: { $regex: new RegExp(lecturerName, 'i') },
    }).sort({ order: 1 });

    // Sort by the logical week order: Sun→Sat, then by startTime string
    const sorted = periods.slice().sort((a, b) => {
      const dayDiff = (DAY_INDEX[a.day] ?? 7) - (DAY_INDEX[b.day] ?? 7);
      if (dayDiff !== 0) return dayDiff;
      return a.startTime.localeCompare(b.startTime);
    });

    const result = sorted.map((p) => ({
      id:         p._id,
      day:        p.day,
      startTime:  p.startTime,
      endTime:    p.endTime,
      classType:  p.classType,
      moduleCode: p.moduleCode,
      moduleName: p.moduleName,
      group:      (p.groupNames || []).join(' + '),
      room:       p.roomName,
    }));

    res.status(200).json(result);
  } catch (err) {
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
  getTeacherUpcomingClasses,
};