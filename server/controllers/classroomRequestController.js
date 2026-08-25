const Classroom = require('../models/Classroom');
const ClassroomRequest = require('../models/ClassroomRequest');

// ========================================================
// STUDENT
// ========================================================

// POST /api/classroom-requests
// Body: { classroomId, day, startTime, endTime, reason }
const createRequest = async (req, res) => {
  try {
    const { classroomId, day, startTime, endTime, reason } = req.body;

    if (!classroomId || !day || !startTime || !endTime) {
      return res.status(400).json({ message: 'classroomId, day, startTime, and endTime are required' });
    }

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });

    // Prevent a user from spamming duplicate pending requests for the same room+day.
    const existingPending = await ClassroomRequest.findOne({
      classroom: classroomId,
      day,
      requestedBy: req.user._id,
      status: 'pending',
    });
    if (existingPending) {
      return res.status(400).json({ message: 'You already have a pending request for this room on this day' });
    }

    const request = await ClassroomRequest.create({
      classroom: classroomId,
      roomName: classroom.name,
      requestedBy: req.user._id,
      requesterName: req.user.username || req.user.name || 'Unknown',
      day,
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      reason: reason?.trim() || '',
      status: 'pending',
    });

    res.status(201).json(request);
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

// GET /api/classroom-requests/mine
// Returns the current user's own requests, so the frontend can show
// vacant / pending / approved status per room without a separate map.
const getMyRequests = async (req, res) => {
  try {
    const requests = await ClassroomRequest.find({ requestedBy: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/classroom-requests/:id
// Lets a student release/cancel their own approved or pending request.
const cancelMyRequest = async (req, res) => {
  try {
    const request = await ClassroomRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (String(request.requestedBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only cancel your own requests' });
    }

    await request.deleteOne();
    res.status(200).json({ message: 'Request cancelled' });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid request ID' });
    res.status(500).json({ message: err.message });
  }
};

// ========================================================
// ADMIN
// ========================================================

// GET /api/classroom-requests/admin
// All requests, newest first, for the admin management list.
const getAllRequests = async (req, res) => {
  try {
    const requests = await ClassroomRequest.find({}).sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/classroom-requests/:id/review
// Body: { status: 'approved' | 'rejected', reviewNote }
const reviewRequest = async (req, res) => {
  try {
    const { status, reviewNote } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "status must be 'approved' or 'rejected'" });
    }

    const request = await ClassroomRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.status = status;
    request.reviewedBy = req.user._id;
    request.reviewNote = reviewNote?.trim() || '';

    const updated = await request.save();
    res.status(200).json(updated);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid request ID' });
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createRequest,
  getMyRequests,
  cancelMyRequest,
  getAllRequests,
  reviewRequest,
};