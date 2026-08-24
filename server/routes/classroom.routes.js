const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  getVacantClassrooms,
  requestClassroom,
  getMyClassroomRequests,

  getAllVacantClassrooms,
  createVacantClassroom,
  updateVacantClassroom,
  deleteVacantClassroom,

  getClassroomRequests,
  updateRequestStatus,
} = require("../controllers/classroomController");

const allRoles = roleMiddleware(
  "student",
  "teacher",
  "staff",
  "admin"
);

const adminOnly = roleMiddleware("admin");


// ---------- STUDENT ----------
router.get("/", authMiddleware, allRoles, getVacantClassrooms);

router.post(
  "/requests",
  authMiddleware,
  allRoles,
  requestClassroom
);

router.get(
  "/my-requests",
  authMiddleware,
  allRoles,
  getMyClassroomRequests
);


// ---------- ADMIN - CLASSROOMS ----------
router.get(
  "/admin",
  authMiddleware,
  adminOnly,
  getAllVacantClassrooms
);

router.post(
  "/",
  authMiddleware,
  adminOnly,
  createVacantClassroom
);

router.patch(
  "/:id",
  authMiddleware,
  adminOnly,
  updateVacantClassroom
);

router.delete(
  "/:id",
  authMiddleware,
  adminOnly,
  deleteVacantClassroom
);


// ---------- ADMIN - REQUESTS ----------
router.get(
  "/requests/admin",
  authMiddleware,
  adminOnly,
  getClassroomRequests
);

router.patch(
  "/requests/:id",
  authMiddleware,
  adminOnly,
  updateRequestStatus
);

module.exports = router;