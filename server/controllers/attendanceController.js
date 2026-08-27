const Attendance = require('../models/Attendance');
const AttendanceReportRequest = require('../models/AttendanceReportRequest');
const User = require('../models/User');
const { createNotification } = require('../utils/createNotification');


// ========================================================
// STUDENT
// ========================================================

const getMyAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({ student: req.user._id });

    const totalDays = records.length;
    const present = records.filter((r) => r.status === 'Present').length;
    const absent = totalDays - present;
    const percentage = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;

    res.status(200).json({ percentage, present, absent, totalDays });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMyAttendanceLog = async (req, res) => {
  try {
    const records = await Attendance.find({ student: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createReportRequest = async (req, res) => {
  try {
    const { reason } = req.body;

    const request = await AttendanceReportRequest.create({
      student: req.user._id,
      studentName: req.user.username || req.user.name || 'Unknown',
      reason: reason?.trim() || '',
      status: 'pending',
    });

    res.status(201).json(request);
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

const getMyReportRequests = async (req, res) => {
  try {
    const requests = await AttendanceReportRequest.find({ student: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ========================================================
// ADMIN
// ========================================================

const getAllAttendanceAdmin = async (req, res) => {
  try {
    const filter = {};
    if (req.query.studentId) filter.student = req.query.studentId;

    const records = await Attendance.find(filter)
      .populate('student', 'username email')
      .sort({ createdAt: -1 });
    res.status(200).json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const markAttendance = async (req, res) => {
  try {
    const { studentId, date, time, room, status } = req.body;

    if (!studentId || !date || !status) {
      return res.status(400).json({ message: 'studentId, date, and status are required' });
    }

    const record = await Attendance.create({
      student: studentId,
      date: date.trim(),
      time: time?.trim() || '',
      room: room?.trim() || '',
      status,
      markedBy: req.user._id,
    });

    createNotification(studentId, {
      type: 'attendance',
      title: 'Attendance Recorded',
      message: `Marked ${status} for ${date.trim()}`,
      link: '/ssd-help',
    });

    res.status(201).json(record);
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

const updateAttendance = async (req, res) => {
  try {
    const record = await Attendance.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Attendance record not found' });

    const { date, time, room, status } = req.body;
    if (date !== undefined) record.date = date.trim();
    if (time !== undefined) record.time = time.trim();
    if (room !== undefined) record.room = room.trim();
    if (status !== undefined) record.status = status;

    const updated = await record.save();

    createNotification(record.student, {
      type: 'attendance',
      title: 'Attendance Modified',
      message: `Your attendance for ${updated.date} was updated to ${updated.status}`,
      link: '/ssd-help',
    });

    res.status(200).json(updated);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid record ID' });
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

const deleteAttendance = async (req, res) => {
  try {
    const record = await Attendance.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Attendance record not found' });

    await record.deleteOne();
    res.status(200).json({ message: 'Attendance record deleted' });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid record ID' });
    res.status(500).json({ message: err.message });
  }
};

const getAllReportRequestsAdmin = async (req, res) => {
  try {
    const requests = await AttendanceReportRequest.find({}).sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateReportRequest = async (req, res) => {
  try {
    const request = await AttendanceReportRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Report request not found' });

    const { status, adminNote, reportFileUrl } = req.body;
    if (status !== undefined) request.status = status;
    if (adminNote !== undefined) request.adminNote = adminNote.trim();
    if (reportFileUrl !== undefined) request.reportFileUrl = reportFileUrl.trim();
    if (status === 'fulfilled') request.fulfilledBy = req.user._id;

    const updated = await request.save();
    res.status(200).json(updated);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid request ID' });
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

// ========================================================
// ADMIN — Per-student attendance summary (for dashboard stats)
// ========================================================

const getAttendanceSummaryAdmin = async (req, res) => {
  try {
    const students = await User.find({ role: 'student', status: 'approved' })
      .select('username email department')
      .sort({ username: 1 })
      .lean();

    const records = await Attendance.find({}).select('student status').lean();

    const byStudent = {};
    records.forEach((r) => {
      const key = r.student.toString();
      if (!byStudent[key]) byStudent[key] = { present: 0, total: 0 };
      byStudent[key].total += 1;
      if (r.status === 'Present') byStudent[key].present += 1;
    });

    const summary = students.map((s) => {
      const stats = byStudent[s._id.toString()] || { present: 0, total: 0 };
      const totalDays = stats.total;
      const present = stats.present;
      const absent = totalDays - present;
      const percentage = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;

      return {
        studentId: s._id,
        username: s.username,
        email: s.email,
        department: s.department,
        present,
        absent,
        totalDays,
        percentage,
      };
    });

    res.status(200).json(summary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ========================================================
// ADMIN — Quick-set totals (bulk regenerates session records)
// ========================================================
// Lets an admin type totalDays/present/absent directly, same as the old
// UI. Under the hood it wipes this student's session log and regenerates
// it with `present` Present-status records and `absent` Absent-status
// records, so the per-session model (used by the student activity log,
// getAttendanceSummaryAdmin, etc.) always stays the source of truth.
const quickSetAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { totalDays, present, absent } = req.body;

    if ([totalDays, present, absent].some((v) => typeof v !== 'number' || v < 0)) {
      return res.status(400).json({ message: 'totalDays, present, absent must be non-negative numbers' });
    }
    if (present + absent !== totalDays) {
      return res
        .status(400)
        .json({ message: `present (${present}) + absent (${absent}) must equal totalDays (${totalDays})` });
    }

    await Attendance.deleteMany({ student: studentId });

    const records = [];
    for (let i = 0; i < present; i += 1) {
      records.push({
        student: studentId,
        date: `Bulk Entry ${i + 1}`,
        status: 'Present',
        markedBy: req.user._id,
      });
    }
    for (let i = 0; i < absent; i += 1) {
      records.push({
        student: studentId,
        date: `Bulk Entry ${present + i + 1}`,
        status: 'Absent',
        markedBy: req.user._id,
      });
    }

    if (records.length > 0) {
      await Attendance.insertMany(records);
    }

    createNotification(studentId, {
      type: 'attendance',
      title: 'Attendance Modified',
      message: `Your attendance was updated — ${present}/${totalDays} days present`,
      link: '/ssd-help',
    });

    res.status(200).json({
      message: 'Attendance updated',
      record: {
        totalDays,
        present,
        absent,
        percentage: totalDays > 0 ? Math.round((present / totalDays) * 100) : 0,
      },
    });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid student ID' });
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getMyAttendance,
  getMyAttendanceLog,
  createReportRequest,
  getMyReportRequests,
  getAllAttendanceAdmin,
  getAttendanceSummaryAdmin,
  quickSetAttendance,
  markAttendance,
  updateAttendance,
  deleteAttendance,
  getAllReportRequestsAdmin,
  updateReportRequest,
};