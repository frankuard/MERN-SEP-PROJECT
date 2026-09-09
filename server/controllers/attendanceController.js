const Attendance = require('../models/Attendance');
const AttendanceReportRequest = require('../models/AttendanceReportRequest');
const User = require('../models/User');
const SemesterConfig = require('../models/SemesterConfig');
const { createNotification } = require('../utils/createNotification');
const { emitToAll } = require('../utils/socketEmitter');

// Recomputes a single student's attendance summary — used to broadcast
// a fresh snapshot any time their records change, without sending the
// entire records collection over the socket.
const computeSummary = async (studentId) => {
  const records = await Attendance.find({ student: studentId });
  const totalDays = records.length;
  const present = records.filter((r) => r.status === 'Present').length;
  const absent = totalDays - present;
  const percentage = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;
  return { percentage, present, absent, totalDays };
};


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

    const summary = await computeSummary(studentId);

    // Broadcast so the student's dashboard + SSD Help page update live
    emitToAll('attendance:updated', { studentId, summary, record });

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

    const summary = await computeSummary(updated.student);

    // Broadcast so the student's dashboard + SSD Help page update live
    emitToAll('attendance:updated', { studentId: updated.student, summary, record: updated });

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

    const studentId = record.student;
    const recordId = record._id;
    await record.deleteOne();

    const summary = await computeSummary(studentId);

    // Broadcast so the student's dashboard + SSD Help page update live
    emitToAll('attendance:updated', { studentId, summary, deletedRecordId: recordId });

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

    if (status === 'fulfilled' || status === 'rejected') {
      createNotification(updated.student, {
        type: 'attendance',
        title: status === 'fulfilled' ? 'Report Request Approved' : 'Report Request Rejected',
        message: status === 'fulfilled'
          ? 'Your attendance report request has been approved.'
          : `Your attendance report request was rejected.${updated.adminNote ? ` Reason: ${updated.adminNote}` : ''}`,
        link: 'ssd-help',
      });
    }

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
    const filter = { role: 'student', status: 'approved' };
    if (req.query.semester && req.query.semester !== 'All') {
      filter.semester = req.query.semester;
    }
    if (req.query.department && req.query.department !== 'All') {
      filter.department = req.query.department;
    }

    const students = await User.find(filter)
      .select('username email department semester')
      .sort({ username: 1 })
      .lean();

    const records = await Attendance.find({}).select('student status').lean();
    const configs = await SemesterConfig.find({}).lean();
    const configMap = {};
    configs.forEach((c) => {
      const sem = String(c.semester || '').trim();
      const dept = String(c.department || '').trim();
      if (dept) {
        configMap[`${dept}_${sem}`] = c.totalDays;
      }
      if (configMap[sem] === undefined) {
        configMap[sem] = c.totalDays;
      }
    });

    const byStudent = {};
    records.forEach((r) => {
      const key = r.student.toString();
      if (!byStudent[key]) byStudent[key] = { present: 0, total: 0 };
      byStudent[key].total += 1;
      if (r.status === 'Present') byStudent[key].present += 1;
    });

    const summary = students.map((s) => {
      const stats = byStudent[s._id.toString()] || { present: 0, total: 0 };
      const semKey = s.semester ? String(s.semester).replace(/^semester\s*/i, '').trim() : '';
      const deptKey = s.department ? String(s.department).trim() : '';

      let totalDays = stats.total;
      if (deptKey && semKey && configMap[`${deptKey}_${semKey}`] !== undefined) {
        totalDays = configMap[`${deptKey}_${semKey}`];
      } else if (semKey && configMap[semKey] !== undefined) {
        totalDays = configMap[semKey];
      }

      const present = Math.min(stats.present, totalDays);
      const absent = Math.max(0, totalDays - present);
      const percentage = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;

      return {
        studentId: s._id,
        username: s.username,
        email: s.email,
        department: s.department || '',
        semester: s.semester || '',
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

const getSemesterConfigs = async (req, res) => {
  try {
    const configs = await SemesterConfig.find({}).lean();
    const configMap = {};
    configs.forEach((c) => {
      const sem = String(c.semester || '').trim();
      const dept = String(c.department || '').trim();
      if (dept) {
        configMap[`${dept}_${sem}`] = c.totalDays;
      }
      if (configMap[sem] === undefined) {
        configMap[sem] = c.totalDays;
      }
    });
    res.status(200).json(configMap);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const setSemesterTotalDays = async (req, res) => {
  try {
    const { department, semester, totalDays } = req.body;
    if (!semester || typeof totalDays !== 'number' || totalDays < 0) {
      return res.status(400).json({ message: 'Valid semester and non-negative totalDays are required' });
    }

    const semKey = String(semester).replace(/^semester\s*/i, '').trim();
    const deptKey = String(department || '').trim();

    await SemesterConfig.findOneAndUpdate(
      { department: deptKey, semester: semKey },
      { department: deptKey, semester: semKey, totalDays },
      { upsert: true, new: true }
    );

    const studentFilter = {
      role: 'student',
      status: 'approved',
      $or: [{ semester: semKey }, { semester: `Semester ${semKey}` }],
    };
    if (deptKey && deptKey !== 'All') {
      studentFilter.department = deptKey;
    }

    const students = await User.find(studentFilter).select('_id username department semester');

    for (const student of students) {
      const existingPresent = await Attendance.countDocuments({
        student: student._id,
        status: 'Present',
      });
      const present = Math.min(existingPresent, totalDays);
      const absent = Math.max(0, totalDays - present);

      await Attendance.deleteMany({ student: student._id });

      const records = [];
      for (let i = 0; i < present; i += 1) {
        records.push({
          student: student._id,
          date: `Session ${i + 1}`,
          status: 'Present',
          markedBy: req.user._id,
        });
      }
      for (let i = 0; i < absent; i += 1) {
        records.push({
          student: student._id,
          date: `Session ${present + i + 1}`,
          status: 'Absent',
          markedBy: req.user._id,
        });
      }
      if (records.length > 0) {
        await Attendance.insertMany(records);
      }

      const summary = {
        totalDays,
        present,
        absent,
        percentage: totalDays > 0 ? Math.round((present / totalDays) * 100) : 0,
      };

      emitToAll('attendance:updated', { studentId: student._id, summary, logReplaced: true });
    }

    res.status(200).json({
      message: `Total days for ${deptKey ? deptKey + ' ' : ''}Semester ${semKey} set to ${totalDays}`,
      department: deptKey,
      semester: semKey,
      totalDays,
    });
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

    const summary = {
      totalDays,
      present,
      absent,
      percentage: totalDays > 0 ? Math.round((present / totalDays) * 100) : 0,
    };

    // Broadcast so the student's dashboard + SSD Help page update live.
    // logReplaced flags that the whole record set was regenerated (bulk
    // quick-set), so listeners should re-fetch the log instead of
    // trying to patch individual records.
    emitToAll('attendance:updated', { studentId, summary, logReplaced: true });

    createNotification(studentId, {
      type: 'attendance',
      title: 'Attendance Modified',
      message: `Your attendance was updated — ${present}/${totalDays} days present`,
      link: '/ssd-help',
    });

    res.status(200).json({
      message: 'Attendance updated',
      record: summary,
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
  getSemesterConfigs,
  setSemesterTotalDays,
  quickSetAttendance,
  markAttendance,
  updateAttendance,
  deleteAttendance,
  getAllReportRequestsAdmin,
  updateReportRequest,
};