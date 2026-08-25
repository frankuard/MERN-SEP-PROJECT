const Classroom = require('../models/Classroom');
const Timetable = require('../models/Timetable');

// GET /api/classrooms
const getClassrooms = async (req, res) => {
  try {
    const classrooms = await Classroom.find({}).sort({ name: 1 });
    res.status(200).json(classrooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/classrooms/vacant?day=Monday
// Automatic: cross-checks real Timetable periods for that day.
// Also excludes rooms with an active manual block for that day.
const getVacantClassrooms = async (req, res) => {
  try {
    const { day } = req.query;
    if (!day) {
      return res.status(400).json({ message: 'day is required, e.g. ?day=Monday' });
    }

    const classrooms = await Classroom.find({}).sort({ name: 1 });
    const periods = await Timetable.find({ day });

    const result = classrooms.map((room) => {
      const roomIdStr = room._id.toString();

      const occupyingPeriod = periods.find((p) => p.room.toString() === roomIdStr);
      const activeBlock = (room.manualBlocks || []).find((b) => b.day === day);

      let status = 'vacant'; // 'vacant' | 'class' | 'blocked'
      let occupiedBy = null;

      if (occupyingPeriod) {
        status = 'class';
        occupiedBy = {
          type: 'class',
          startTime: occupyingPeriod.startTime,
          endTime: occupyingPeriod.endTime,
          moduleCode: occupyingPeriod.moduleCode,
          moduleName: occupyingPeriod.moduleName,
        };
      } else if (activeBlock) {
        status = 'blocked';
        occupiedBy = {
          type: 'blocked',
          blockId: activeBlock._id,
          startTime: activeBlock.startTime,
          endTime: activeBlock.endTime,
          reason: activeBlock.reason,
        };
      }

      return {
        _id: room._id,
        name: room.name,
        capacity: room.capacity,
        facilities: room.facilities,
        status,
        occupiedBy,
        manualBlocks: room.manualBlocks || [],
      };
    });

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/classrooms
const createClassroom = async (req, res) => {
  try {
    const { name, capacity, facilities } = req.body;

    if (!name || !capacity) {
      return res.status(400).json({ message: 'name and capacity are required' });
    }

    const exists = await Classroom.findOne({ name: name.trim() });
    if (exists) {
      return res.status(400).json({ message: 'A classroom with this name already exists' });
    }

    const classroom = await Classroom.create({
      name: name.trim(),
      capacity: Number(capacity),
      facilities: facilities?.trim() || '',
    });

    res.status(201).json(classroom);
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/classrooms/:id
const updateClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });

    const { name, capacity, facilities } = req.body;
    if (name !== undefined) classroom.name = name.trim();
    if (capacity !== undefined) classroom.capacity = Number(capacity);
    if (facilities !== undefined) classroom.facilities = facilities.trim();

    const updated = await classroom.save();
    res.status(200).json(updated);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid classroom ID' });
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/classrooms/:id
const deleteClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });

    await classroom.deleteOne();
    res.status(200).json({ message: 'Classroom deleted' });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid classroom ID' });
    res.status(500).json({ message: err.message });
  }
};

// POST /api/classrooms/:id/block  (admin — manual override)
const addManualBlock = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });

    const { day, startTime, endTime, reason, createdBy } = req.body;
    if (!day || !startTime || !endTime) {
      return res.status(400).json({ message: 'day, startTime, and endTime are required' });
    }

    classroom.manualBlocks.push({
      day,
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      reason: reason?.trim() || '',
      createdBy: createdBy?.trim() || '',
    });

    const updated = await classroom.save();
    res.status(201).json(updated);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid classroom ID' });
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/classrooms/:id/block/:blockId  (admin — remove manual override)
const removeManualBlock = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });

    const before = classroom.manualBlocks.length;
    classroom.manualBlocks = classroom.manualBlocks.filter(
      (b) => b._id.toString() !== req.params.blockId
    );

    if (classroom.manualBlocks.length === before) {
      return res.status(404).json({ message: 'Block not found' });
    }

    const updated = await classroom.save();
    res.status(200).json(updated);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID' });
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getClassrooms,
  getVacantClassrooms,
  createClassroom,
  updateClassroom,
  deleteClassroom,
  addManualBlock,
  removeManualBlock,
};