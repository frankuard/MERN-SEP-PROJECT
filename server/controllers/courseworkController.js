const Coursework = require('../models/Coursework');
const CourseworkSubmission = require('../models/CourseworkSubmission');
const Timetable = require('../models/Timetable');
const User = require('../models/User');
const { normalizeName } = require('../utils/normalizeName');
const { createNotification, createNotificationForUsers } = require('../utils/createNotification');

// ============================================================================
// TEACHER: Get Assigned Modules & Groups from Timetable (Real DB accounts)
// ============================================================================
const getTeacherAssignedClasses = async (req, res) => {
  try {
    const teacherKey = normalizeName(req.user?.username || '');
    if (!teacherKey) {
      return res.status(400).json({ message: 'Unable to resolve teacher identity' });
    }

    const allPeriods = await Timetable.find({}).lean();
    const teacherPeriods = allPeriods.filter(
      (p) => normalizeName(p.lecturer) === teacherKey
    );

    // Group by moduleCode
    const moduleMap = new Map();

    teacherPeriods.forEach((period) => {
      const code = period.moduleCode;
      if (!code) return;

      if (!moduleMap.has(code)) {
        moduleMap.set(code, {
          moduleCode: code,
          moduleName: period.moduleName || code,
          moduleId: period.module ? String(period.module) : null,
          groups: new Set(),
        });
      }

      const entry = moduleMap.get(code);
      if (Array.isArray(period.groupNames)) {
        period.groupNames.forEach((g) => {
          if (g && g.trim()) entry.groups.add(g.trim());
        });
      }
    });

    const assignedClasses = Array.from(moduleMap.values()).map((item) => ({
      moduleCode: item.moduleCode,
      moduleName: item.moduleName,
      moduleId: item.moduleId,
      groups: Array.from(item.groups).sort(),
    }));

    res.status(200).json({
      teacherName: req.user.username,
      assignedClasses,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ============================================================================
// TEACHER: Create Coursework Assignment
// ============================================================================
const createCoursework = async (req, res) => {
  try {
    const {
      title,
      description,
      moduleCode,
      moduleName,
      targetGroup,
      dueDate,
      totalMarks,
      attachments,
    } = req.body;

    if (!title || !description || !moduleCode || !targetGroup || !dueDate) {
      return res.status(400).json({
        message: 'Title, description, moduleCode, targetGroup, and dueDate are required',
      });
    }

    const teacherKey = normalizeName(req.user?.username || '');

    // Verify teacher is assigned to this module and group in the database timetable
    const allPeriods = await Timetable.find({}).lean();
    const teacherPeriods = allPeriods.filter(
      (p) => normalizeName(p.lecturer) === teacherKey
    );

    const isAssigned = teacherPeriods.some((p) => {
      const matchesModule = p.moduleCode?.toLowerCase() === moduleCode.trim().toLowerCase();
      const matchesGroup = (p.groupNames || []).some(
        (g) => g.trim().toLowerCase() === targetGroup.trim().toLowerCase()
      );
      return matchesModule && matchesGroup;
    });

    if (!isAssigned) {
      return res.status(403).json({
        message: `You are not assigned to teach module "${moduleCode}" to group "${targetGroup}" in the timetable schedule.`,
      });
    }

    const coursework = await Coursework.create({
      title: title.trim(),
      description: description.trim(),
      moduleCode: moduleCode.trim(),
      moduleName: (moduleName || moduleCode).trim(),
      targetGroup: targetGroup.trim(),
      teacher: req.user._id,
      teacherName: req.user.username,
      dueDate: new Date(dueDate),
      totalMarks: Number(totalMarks) || 100,
      attachments: Array.isArray(attachments) ? attachments : [],
      status: 'active',
    });

    // Notify all real students registered in that targetGroup
    try {
      const targetStudents = await User.find({
        role: 'student',
        group: targetGroup.trim(),
      }).select('_id');

      const studentIds = targetStudents.map((s) => s._id.toString());
      if (studentIds.length > 0) {
        const formattedDate = new Date(dueDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        await createNotificationForUsers(studentIds, {
          type: 'coursework',
          title: `New Coursework: ${coursework.title}`,
          message: `${req.user.username} posted a new coursework for ${coursework.moduleCode} (Due ${formattedDate}).`,
          link: 'coursework',
          meta: { courseworkId: coursework._id },
        });
      }
    } catch (notifErr) {
      console.error('Non-fatal error sending coursework notification:', notifErr.message);
    }

    res.status(201).json(coursework);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ============================================================================
// TEACHER: Get All Coursework Created by This Teacher
// ============================================================================
const getCourseworkForTeacher = async (req, res) => {
  try {
    const courseworkList = await Coursework.find({ teacher: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    // Enrich with submission counts and enrolled student count per group
    const enriched = await Promise.all(
      courseworkList.map(async (c) => {
        const [submissions, enrolledCount] = await Promise.all([
          CourseworkSubmission.find({ coursework: c._id }).lean(),
          User.countDocuments({ role: 'student', group: c.targetGroup }),
        ]);

        const totalSubmissions = submissions.length;
        const gradedCount = submissions.filter((s) => s.status === 'graded').length;
        const pendingCount = totalSubmissions - gradedCount;

        return {
          ...c,
          totalSubmissions,
          gradedCount,
          pendingCount,
          enrolledCount,
        };
      })
    );

    res.status(200).json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ============================================================================
// TEACHER: Update Coursework
// ============================================================================
const updateCoursework = async (req, res) => {
  try {
    const coursework = await Coursework.findById(req.params.id);
    if (!coursework) {
      return res.status(404).json({ message: 'Coursework not found' });
    }

    if (coursework.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own coursework' });
    }

    const { title, description, dueDate, totalMarks, attachments, status } = req.body;

    if (title !== undefined) coursework.title = title.trim();
    if (description !== undefined) coursework.description = description.trim();
    if (dueDate !== undefined) coursework.dueDate = new Date(dueDate);
    if (totalMarks !== undefined) coursework.totalMarks = Number(totalMarks) || 100;
    if (attachments !== undefined) coursework.attachments = attachments;
    if (status !== undefined) coursework.status = status;

    const updated = await coursework.save();
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ============================================================================
// TEACHER: Delete Coursework
// ============================================================================
const deleteCoursework = async (req, res) => {
  try {
    const coursework = await Coursework.findById(req.params.id);
    if (!coursework) {
      return res.status(404).json({ message: 'Coursework not found' });
    }

    if (coursework.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own coursework' });
    }

    await Promise.all([
      coursework.deleteOne(),
      CourseworkSubmission.deleteMany({ coursework: coursework._id }),
    ]);

    res.status(200).json({ message: 'Coursework and submissions deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ============================================================================
// TEACHER: Get Submissions for a Specific Coursework
// ============================================================================
const getSubmissionsForCoursework = async (req, res) => {
  try {
    const coursework = await Coursework.findById(req.params.id).lean();
    if (!coursework) {
      return res.status(404).json({ message: 'Coursework not found' });
    }

    if (coursework.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only view submissions for your own coursework' });
    }

    const [submissions, enrolledStudents] = await Promise.all([
      CourseworkSubmission.find({ coursework: coursework._id })
        .populate('student', 'username email profileImage group')
        .sort({ submittedAt: -1 })
        .lean(),
      User.find({ role: 'student', group: coursework.targetGroup })
        .select('username email profileImage group')
        .sort({ username: 1 })
        .lean(),
    ]);

    const submittedStudentIds = new Set(
      submissions.map((s) => (s.student?._id || s.student).toString())
    );

    const missingStudents = enrolledStudents.filter(
      (student) => !submittedStudentIds.has(student._id.toString())
    );

    res.status(200).json({
      coursework,
      submissions,
      enrolledStudents,
      missingStudents,
      stats: {
        totalEnrolled: enrolledStudents.length,
        submittedCount: submissions.length,
        missingCount: missingStudents.length,
        gradedCount: submissions.filter((s) => s.status === 'graded').length,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ============================================================================
// TEACHER: Grade a Student Submission
// ============================================================================
const gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grade, feedback } = req.body;

    const submission = await CourseworkSubmission.findById(submissionId).populate('coursework');
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const coursework = submission.coursework;
    if (coursework.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to grade this submission' });
    }

    const numericGrade = Number(grade);
    if (Number.isNaN(numericGrade) || numericGrade < 0) {
      return res.status(400).json({ message: 'A valid numeric grade is required' });
    }

    submission.grade = numericGrade;
    submission.feedback = feedback !== undefined ? String(feedback).trim() : '';
    submission.status = 'graded';
    submission.gradedAt = new Date();
    submission.gradedBy = req.user._id;

    const updated = await submission.save();

    // Notify student
    try {
      await createNotification(submission.student, {
        type: 'coursework',
        title: `Graded: ${coursework.title}`,
        message: `Your teacher ${req.user.username} graded your coursework for ${coursework.moduleCode}: ${numericGrade}/${coursework.totalMarks}.`,
        link: 'coursework',
        meta: { courseworkId: coursework._id, submissionId: submission._id },
      });
    } catch (notifErr) {
      console.error('Non-fatal notification error:', notifErr.message);
    }

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ============================================================================
// STUDENT: Get Coursework for Logged-In Student (Group Filtered)
// ============================================================================
const getCourseworkForStudent = async (req, res) => {
  try {
    const studentGroup = req.user?.group || '';

    if (!studentGroup) {
      return res.status(200).json({
        studentGroup: '',
        coursework: [],
        message: 'No cohort group set on your student profile. Please update your profile.',
      });
    }

    // Only fetch coursework specifically targeted to this student's group
    const list = await Coursework.find({
      targetGroup: studentGroup,
      status: { $ne: 'draft' },
    })
      .sort({ dueDate: 1, createdAt: -1 })
      .lean();

    // Fetch this student's submissions
    const mySubmissions = await CourseworkSubmission.find({
      student: req.user._id,
      coursework: { $in: list.map((c) => c._id) },
    }).lean();

    const submissionMap = new Map(
      mySubmissions.map((s) => [s.coursework.toString(), s])
    );

    const enriched = list.map((c) => {
      const mySub = submissionMap.get(c._id.toString()) || null;
      const isPastDue = new Date() > new Date(c.dueDate);

      return {
        ...c,
        mySubmission: mySub,
        hasSubmitted: !!mySub,
        isPastDue,
      };
    });

    res.status(200).json({
      studentGroup,
      coursework: enriched,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ============================================================================
// STUDENT: Submit or Re-submit Work for a Coursework Assignment
// ============================================================================
const submitCoursework = async (req, res) => {
  try {
    const coursework = await Coursework.findById(req.params.id);
    if (!coursework) {
      return res.status(404).json({ message: 'Coursework not found' });
    }

    const studentGroup = req.user?.group || '';
    if (coursework.targetGroup !== studentGroup) {
      return res.status(403).json({
        message: `This coursework is assigned to ${coursework.targetGroup}. Your group is ${studentGroup || 'unassigned'}.`,
      });
    }

    const { submissionText, attachments } = req.body;

    if (!submissionText && (!attachments || attachments.length === 0)) {
      return res.status(400).json({
        message: 'Please provide either submission text/notes or attach a file',
      });
    }

    const isLate = new Date() > new Date(coursework.dueDate);
    const initialStatus = isLate ? 'late' : 'submitted';

    // Upsert submission
    let submission = await CourseworkSubmission.findOne({
      coursework: coursework._id,
      student: req.user._id,
    });

    if (submission) {
      submission.submissionText = (submissionText || '').trim();
      submission.attachments = Array.isArray(attachments) ? attachments : [];
      submission.submittedAt = new Date();
      // If already graded, don't revert to un-graded unless teacher re-evaluates
      if (submission.status !== 'graded') {
        submission.status = initialStatus;
      }
      await submission.save();
    } else {
      submission = await CourseworkSubmission.create({
        coursework: coursework._id,
        student: req.user._id,
        studentName: req.user.username,
        studentEmail: req.user.email,
        studentGroup,
        submissionText: (submissionText || '').trim(),
        attachments: Array.isArray(attachments) ? attachments : [],
        status: initialStatus,
        submittedAt: new Date(),
      });
    }

    res.status(200).json(submission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getTeacherAssignedClasses,
  createCoursework,
  getCourseworkForTeacher,
  updateCoursework,
  deleteCoursework,
  getSubmissionsForCoursework,
  gradeSubmission,
  getCourseworkForStudent,
  submitCoursework,
};
