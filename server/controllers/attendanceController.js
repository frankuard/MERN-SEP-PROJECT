const Attendance = require('../models/Attendance');

const computePercentage = (present, totalDays) =>
  totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;

// GET /api/attendance/my
const getMyAttendance = async (req, res) => {
  try {
    const record = await Attendance.findOne({ student: req.user._id });

    if (!record) {
      return res.status(200).json({ totalDays: 0, present: 0, absent: 0, percentage: 0 });
    }

    res.status(200).json({
      totalDays: record.totalDays,
      present: record.present,
      absent: record.absent,
      percentage: computePercentage(record.present, record.totalDays),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/attendance/student/:userId  (admin sets/updates the numbers directly)
const adminSetAttendance = async (req, res) => {
  try {
    const { totalDays, present, absent } = req.body;

    if ([totalDays, present, absent].some((v) => typeof v !== 'number' || v < 0)) {
      return res.status(400).json({ message: 'totalDays, present, absent must be non-negative numbers' });
    }

    const record = await Attendance.findOneAndUpdate(
      { student: req.params.userId },
      { totalDays, present, absent },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      message: 'Attendance updated',
      record: {
        totalDays: record.totalDays,
        present: record.present,
        absent: record.absent,
        percentage: computePercentage(record.present, record.totalDays),
      },
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid student ID' });
    }
    res.status(500).json({ message: err.message });
  }
};


const User = require('../models/User');

// GET /api/attendance/admin/all — every approved student + their attendance
const getAllStudentsAttendance = async (req, res) => {
  try {
    const students = await User.find({ role: 'student', status: 'approved' })
      .select('username email department semester')
      .sort({ username: 1 });

    const records = await Attendance.find({});
    const recordMap = {};
    records.forEach((r) => { recordMap[r.student.toString()] = r; });

    const result = students.map((s) => {
      const r = recordMap[s._id.toString()];
      const totalDays = r ? r.totalDays : 0;
      const present = r ? r.present : 0;
      const absent = r ? r.absent : 0;
      return {
        studentId: s._id,
        username: s.username,
        email: s.email,
        department: s.department,
        semester: s.semester,
        totalDays,
        present,
        absent,
        percentage: computePercentage(present, totalDays),
      };
    });

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getMyAttendance, adminSetAttendance, getAllStudentsAttendance };
