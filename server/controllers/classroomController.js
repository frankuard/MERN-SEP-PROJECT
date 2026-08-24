const VacantClassroom = require("../models/VacantClassroom");
const ClassroomRequest = require("../models/ClassroomRequest");

// ==========================================
// STUDENT
// ==========================================

// Get vacant classrooms for a particular day
const getVacantClassrooms = async (req, res) => {
  try {
    const { day } = req.query;

    const filter = {
      isAvailable: true,
    };

    if (day) {
      filter.day = day;
    }

    const classrooms = await VacantClassroom.find(filter).sort({
      availableFrom: 1,
    });

    res.status(200).json(classrooms);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// Student requests a classroom
const requestClassroom = async (req, res) => {
  try {
    const {
      classroomId,
      purpose,
      requestDate,
      requestedFrom,
      requestedTo,
    } = req.body;

    if (
      !classroomId ||
      !purpose ||
      !requestDate ||
      !requestedFrom ||
      !requestedTo
    ) {
      return res.status(400).json({
        message: "All request fields are required",
      });
    }

    const classroom = await VacantClassroom.findById(classroomId);

    if (!classroom) {
      return res.status(404).json({
        message: "Classroom not found",
      });
    }

    const request = await ClassroomRequest.create({
      classroom: classroomId,
      requestedBy: req.user.id,
      purpose,
      requestDate,
      requestedFrom,
      requestedTo,
    });

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// Student sees their own requests
const getMyClassroomRequests = async (req, res) => {
  try {
    const requests = await ClassroomRequest.find({
      requestedBy: req.user.id,
    })
      .populate("classroom")
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// ==========================================
// ADMIN - VACANT CLASSROOM MANAGEMENT
// ==========================================

const getAllVacantClassrooms = async (req, res) => {
  try {
    const classrooms = await VacantClassroom.find().sort({
      day: 1,
      availableFrom: 1,
    });

    res.status(200).json(classrooms);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


const createVacantClassroom = async (req, res) => {
  try {
    const classroom = await VacantClassroom.create(req.body);

    res.status(201).json(classroom);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};


const updateVacantClassroom = async (req, res) => {
  try {
    const classroom = await VacantClassroom.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!classroom) {
      return res.status(404).json({
        message: "Classroom not found",
      });
    }

    res.status(200).json(classroom);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};


const deleteVacantClassroom = async (req, res) => {
  try {
    const classroom = await VacantClassroom.findByIdAndDelete(
      req.params.id
    );

    if (!classroom) {
      return res.status(404).json({
        message: "Classroom not found",
      });
    }

    res.status(200).json({
      message: "Vacant classroom deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// ==========================================
// ADMIN - REQUEST MANAGEMENT
// ==========================================

const getClassroomRequests = async (req, res) => {
  try {
    const requests = await ClassroomRequest.find()
      .populate("classroom")
      .populate("requestedBy", "username email")
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


const updateRequestStatus = async (req, res) => {
  try {
    const { status, adminRemark } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be approved or rejected",
      });
    }

    const request = await ClassroomRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    request.status = status;

    if (adminRemark !== undefined) {
      request.adminRemark = adminRemark;
    }

    await request.save();

    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


module.exports = {
  getVacantClassrooms,
  requestClassroom,
  getMyClassroomRequests,

  getAllVacantClassrooms,
  createVacantClassroom,
  updateVacantClassroom,
  deleteVacantClassroom,

  getClassroomRequests,
  updateRequestStatus,
};