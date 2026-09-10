const Timetable = require('../models/Timetable');
const ScheduleChange = require('../models/ScheduleChange');
const Module = require('../models/Module');
const Group = require('../models/Group');
const Classroom = require('../models/Classroom');
const { createNotificationForRole } = require('../utils/createNotification');
const { emitToAll } = require('../utils/socketEmitter');
const { normalizeName } = require('../utils/normalizeName');
const DAY_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Helper for mapping department + semester to Level
const BASE_LEVEL_BY_DEPARTMENT = {
  'BCS': 4,
  'B.Sc. Cybersecurity': 4,
  'BIBM': 3,
};

const getLevelForSemester = (department = 'BCS', semester) => {
  const sem = Number(semester);
  if (!sem || Number.isNaN(sem)) return null;
  if (department === 'MBA') {
    if (sem === 1) return 7;
    if (sem === 2) return 8;
    return null;
  }
  const base = BASE_LEVEL_BY_DEPARTMENT[department] || 4;
  return base + Math.floor((sem - 1) / 2);
};

// UK module code convention:
// 4CS / 4MM -> Level 4 (Sem 1 & 2)
// 5CS / 5MM -> Level 5 (Sem 3 & 4)
// 6CS / 6MM -> Level 6 (Sem 5 & 6)
const getLevelFromModuleCode = (moduleCode = '') => {
  const clean = String(moduleCode).trim().toUpperCase();
  if (clean.startsWith('4')) return 4;
  if (clean.startsWith('5')) return 5;
  if (clean.startsWith('6')) return 6;
  if (clean.startsWith('7')) return 7;
  if (clean.startsWith('8')) return 8;
  if (clean.startsWith('3')) return 3;
  return 4;
};

// Auto-backfill to ensure existing MongoDB records have level/semesters populated
let backfillExecuted = false;
const ensureTimetableAndModuleMetadata = async () => {
  if (backfillExecuted) return;
  backfillExecuted = true;
  try {
    const modulesToUpdate = await Module.find({
      $or: [
        { level: { $exists: false } },
        { level: null },
        { semesters: { $exists: false } },
        { semesters: { $size: 0 } },
      ],
    });
    for (const m of modulesToUpdate) {
      const lvl = getLevelFromModuleCode(m.code);
      const sems = lvl === 4 ? [1, 2] : lvl === 5 ? [3, 4] : lvl === 6 ? [5, 6] : [1, 2];
      m.level = lvl;
      m.semesters = sems;
      if (!m.department) m.department = 'BCS';
      await m.save();
    }

    const periodsToUpdate = await Timetable.find({
      $or: [{ level: { $exists: false } }, { level: null }],
    });
    for (const p of periodsToUpdate) {
      const lvl = getLevelFromModuleCode(p.moduleCode);
      p.level = lvl;
      if (!p.department) p.department = 'BCS';
      await p.save();
    }
  } catch (err) {
    console.error('Timetable/Module backfill error:', err.message);
  }
};

// ========================================================
// STUDENT — Timetable
// ========================================================

const getTimetable = async (req, res) => {
  try {
    await ensureTimetableAndModuleMetadata();

    const allPeriods = await Timetable.find({}).sort({ day: 1, order: 1, startTime: 1 });

    let visiblePeriods = allPeriods;

    if (req.user?.role === 'teacher') {
      // Match by normalized name so titles/case in the JSON don't matter
      const teacherKey = normalizeName(req.user.username || '');
      visiblePeriods = allPeriods.filter((p) => normalizeName(p.lecturer) === teacherKey);
    } else if (req.user?.role === 'student') {
      const dept = req.user.department || 'BCS';
      const requestedSemester = req.query.semester ? Number(req.query.semester) : null;
      const studentSemester = requestedSemester || (req.user.semester ? Number(req.user.semester) : 2);
      const studentLevel = req.query.level
        ? Number(req.query.level)
        : getLevelForSemester(dept, studentSemester);

      const studentGroup = req.user.group || '';

      visiblePeriods = allPeriods.filter((p) => {
        const periodLevel = p.level || getLevelFromModuleCode(p.moduleCode);

        // Strict level matching: Semester 2 (Level 4 / 4CS) MUST NOT see Level 5 / 5CS (Sem 3 & 4)
        if (studentLevel && periodLevel !== studentLevel) {
          return false;
        }

        // If period has an explicit semester specified, ensure it matches
        if (p.semester && studentSemester && p.semester !== studentSemester) {
          return false;
        }

        // If student has a cohort group (e.g. L4CG1)
        if (studentGroup) {
          const hasGroups = Array.isArray(p.groupNames) && p.groupNames.length > 0;
          if (hasGroups && !p.groupNames.includes(studentGroup)) {
            return false;
          }
        }

        return true;
      });
    } else {
      // Staff / Admin or unrestricted caller: allow optional query filtering
      if (req.query.level) {
        const lvl = Number(req.query.level);
        visiblePeriods = visiblePeriods.filter((p) => (p.level || getLevelFromModuleCode(p.moduleCode)) === lvl);
      }
      if (req.query.semester) {
        const sem = Number(req.query.semester);
        visiblePeriods = visiblePeriods.filter((p) => {
          if (p.semester) return p.semester === sem;
          const lvl = p.level || getLevelFromModuleCode(p.moduleCode);
          return lvl === getLevelForSemester(p.department || 'BCS', sem);
        });
      }
    }

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
          level: p.level || getLevelFromModuleCode(p.moduleCode),
          semester: p.semester || null,
          department: p.department || 'BCS',
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
    await ensureTimetableAndModuleMetadata();

    const filter = {};
    if (req.query.day) filter.day = req.query.day;
    if (req.query.level) filter.level = Number(req.query.level);
    if (req.query.semester) filter.semester = Number(req.query.semester);

    const periods = await Timetable.find(filter).sort({ day: 1, order: 1, startTime: 1 });
    res.status(200).json(periods);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createPeriod = async (req, res) => {
  try {
    const {
      day,
      startTime,
      endTime,
      classType,
      moduleId,
      lecturer,
      groupIds,
      roomId,
      order,
      level,
      semester,
      department,
    } = req.body;

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

    const parsedLevel =
      level !== undefined && level !== null && level !== ''
        ? Number(level)
        : moduleDoc.level || getLevelFromModuleCode(moduleDoc.code);

    const parsedSemester =
      semester !== undefined && semester !== null && semester !== ''
        ? Number(semester)
        : null;

    const period = await Timetable.create({
      day,
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      classType,
      module: moduleDoc._id,
      moduleCode: moduleDoc.code,
      moduleName: moduleDoc.name,
      level: parsedLevel,
      semester: parsedSemester,
      department: department ? department.trim() : moduleDoc.department || 'BCS',
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

    const {
      day,
      startTime,
      endTime,
      classType,
      moduleId,
      lecturer,
      groupIds,
      roomId,
      order,
      level,
      semester,
      department,
    } = req.body;

    if (day !== undefined) period.day = day;
    if (startTime !== undefined) period.startTime = startTime.trim();
    if (endTime !== undefined) period.endTime = endTime.trim();
    if (classType !== undefined) period.classType = classType;
    if (lecturer !== undefined) period.lecturer = lecturer.trim();
    if (order !== undefined) period.order = Number(order);
    if (level !== undefined && level !== null && level !== '') period.level = Number(level);
    if (semester !== undefined) period.semester = semester ? Number(semester) : null;
    if (department !== undefined) period.department = department.trim();

    if (moduleId !== undefined) {
      const moduleDoc = await Module.findById(moduleId);
      if (!moduleDoc) return res.status(404).json({ message: 'Module not found' });
      period.module = moduleDoc._id;
      period.moduleCode = moduleDoc.code;
      period.moduleName = moduleDoc.name;
      if (level === undefined) {
        period.level = moduleDoc.level || getLevelFromModuleCode(moduleDoc.code);
      }
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
    const teacherKey = normalizeName(req.user?.username || '');
    if (!teacherKey) {
      return res.status(400).json({ message: 'Unable to resolve teacher identity' });
    }

    const allPeriods = await Timetable.find({}).sort({ order: 1 });
    const periods = allPeriods.filter((p) => normalizeName(p.lecturer) === teacherKey);

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