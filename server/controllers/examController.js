const Exam = require('../models/Exam');
const Module = require('../models/Module');
const { createNotificationForRole } = require('../utils/createNotification');

// Helper: format a Date into a human-readable display string
// e.g. 2026-09-14  →  "Sep 14, 2026 (Sunday)"
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const formatDateDisplay = (date) => {
  const d = new Date(date);
  const month = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  const day   = d.getUTCDate();
  const year  = d.getUTCFullYear();
  const weekday = DAY_NAMES[d.getUTCDay()];
  return `${month} ${day}, ${year} (${weekday})`;
};

// Shape returned to students — includes a pre-formatted dateDisplay string
// so the countdown parser in TimetableSection.jsx can handle it the same
// way it handled the old static UPCOMING_EXAMS data.
const toStudentShape = (exam) => ({
  _id: exam._id,
  moduleCode: exam.moduleCode || '',
  moduleName: exam.moduleName,
  group: exam.group || '',
  examType: exam.examType,
  date: formatDateDisplay(exam.date),   // "Sep 14, 2026 (Sunday)"
  startTime: exam.startTime,
  endTime: exam.endTime,
  room: exam.room,
  notes: exam.notes || '',
});

// ─────────────────────────────────────────────────────────────
//  STUDENT
// ─────────────────────────────────────────────────────────────

// GET /api/timetable/exams
// Returns only upcoming (date >= today) active exams, sorted by date asc.
const getExams = async (req, res) => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // compare from start-of-day UTC

    const exams = await Exam.find({
      isActive: true,
      date: { $gte: today },
    }).sort({ date: 1, startTime: 1 });

    res.status(200).json(exams.map(toStudentShape));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
//  ADMIN
// ─────────────────────────────────────────────────────────────

// GET /api/timetable/exams/admin
// Returns ALL exams (past + future, active + inactive), newest first.
const getExamsAdmin = async (req, res) => {
  try {
    const exams = await Exam.find({}).sort({ date: -1 });
    res.status(200).json(exams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/timetable/exams
const createExam = async (req, res) => {
  try {
    const { moduleName, moduleId, group, examType, date, startTime, endTime, room, notes } = req.body;

    if (!moduleName || !moduleName.trim()) {
      return res.status(400).json({ message: 'Module name is required' });
    }
    if (!examType) return res.status(400).json({ message: 'Exam type is required' });
    if (!date)     return res.status(400).json({ message: 'Date is required' });
    if (!startTime || !startTime.trim()) return res.status(400).json({ message: 'Start time is required' });
    if (!endTime   || !endTime.trim())   return res.status(400).json({ message: 'End time is required' });
    if (!room      || !room.trim())      return res.status(400).json({ message: 'Room / venue is required' });

    // Optionally resolve a Module document for the code snapshot
    let moduleCode = '';
    let moduleRef  = null;
    if (moduleId) {
      const moduleDoc = await Module.findById(moduleId);
      if (!moduleDoc) return res.status(404).json({ message: 'Module not found' });
      moduleCode = moduleDoc.code || '';
      moduleRef  = moduleDoc._id;
    }

    const exam = await Exam.create({
      moduleName: moduleName.trim(),
      module:     moduleRef,
      moduleCode,
      group:      group?.trim() || '',
      examType,
      date:       new Date(date),
      startTime:  startTime.trim(),
      endTime:    endTime.trim(),
      room:       room.trim(),
      notes:      notes?.trim() || '',
    });

    // Notify all students of the new exam
    createNotificationForRole('student', {
      type: 'timetable',
      title: 'Upcoming Exam Scheduled',
      message: `${exam.examType}: ${exam.moduleName} on ${formatDateDisplay(exam.date)}, ${exam.startTime} – ${exam.endTime}`,
      link: 'rte',
    });

    res.status(201).json(exam);
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/timetable/exams/:id
const updateExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const { moduleName, moduleId, group, examType, date, startTime, endTime, room, notes, isActive } = req.body;

    if (moduleName  !== undefined) exam.moduleName  = moduleName.trim();
    if (group       !== undefined) exam.group       = group.trim();
    if (examType    !== undefined) exam.examType    = examType;
    if (date        !== undefined) exam.date        = new Date(date);
    if (startTime   !== undefined) exam.startTime   = startTime.trim();
    if (endTime     !== undefined) exam.endTime     = endTime.trim();
    if (room        !== undefined) exam.room        = room.trim();
    if (notes       !== undefined) exam.notes       = notes.trim();
    if (isActive    !== undefined) exam.isActive    = isActive;

    if (moduleId !== undefined) {
      if (!moduleId) {
        exam.module     = null;
        exam.moduleCode = '';
      } else {
        const moduleDoc = await Module.findById(moduleId);
        if (!moduleDoc) return res.status(404).json({ message: 'Module not found' });
        exam.module     = moduleDoc._id;
        exam.moduleCode = moduleDoc.code || '';
      }
    }

    const updated = await exam.save();

    createNotificationForRole('student', {
      type: 'timetable',
      title: 'Exam Details Updated',
      message: `${updated.examType}: ${updated.moduleName} — details have been updated.`,
      link: 'rte',
    });

    res.status(200).json(updated);
  } catch (err) {
    if (err.name === 'CastError')      return res.status(400).json({ message: 'Invalid exam ID' });
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/timetable/exams/:id
const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    await exam.deleteOne();
    res.status(200).json({ message: 'Exam deleted', id: req.params.id });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid exam ID' });
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getExams,
  getExamsAdmin,
  createExam,
  updateExam,
  deleteExam,
};
