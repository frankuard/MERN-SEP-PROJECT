const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
  getTeacherAssignedClasses,
  createCoursework,
  getCourseworkForTeacher,
  updateCoursework,
  deleteCoursework,
  getSubmissionsForCoursework,
  gradeSubmission,
  getCourseworkForStudent,
  submitCoursework,
} = require('../controllers/courseworkController');

const teacherOnly = roleMiddleware('teacher');
const studentOnly = roleMiddleware('student');

// ================= TEACHER ROUTES =================
router.get('/teacher/assigned', authMiddleware, teacherOnly, getTeacherAssignedClasses);
router.get('/teacher', authMiddleware, teacherOnly, getCourseworkForTeacher);
router.post('/', authMiddleware, teacherOnly, createCoursework);
router.patch('/:id', authMiddleware, teacherOnly, updateCoursework);
router.delete('/:id', authMiddleware, teacherOnly, deleteCoursework);
router.get('/:id/submissions', authMiddleware, teacherOnly, getSubmissionsForCoursework);
router.patch('/submissions/:submissionId/grade', authMiddleware, teacherOnly, gradeSubmission);

// ================= STUDENT ROUTES =================
router.get('/', authMiddleware, studentOnly, getCourseworkForStudent);
router.post('/:id/submit', authMiddleware, studentOnly, submitCoursework);

module.exports = router;
