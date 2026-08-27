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

const CAMPUS_START = '7:00 AM';
const CAMPUS_END = '6:00 PM';

const parseTimeToMinutes = (str) => {
  if (!str) return null;
  const m = str.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ap = m[3].toUpperCase();
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return h * 60 + min;
};

const minutesToTime = (mins) => {
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const ap = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ap}`;
};

// Merge a list of {start, end} minute ranges that may overlap/touch into
// the minimum set of non-overlapping occupied ranges.
const mergeRanges = (ranges) => {
  const sorted = ranges
    .filter((r) => r.start !== null && r.end !== null && r.end > r.start)
    .sort((a, b) => a.start - b.start);

  const merged = [];
  for (const r of sorted) {
    const last = merged[merged.length - 1];
    if (last && r.start <= last.end) {
      last.end = Math.max(last.end, r.end);
    } else {
      merged.push({ ...r });
    }
  }
  return merged;
};

// GET /api/classrooms/vacant?day=Monday
// Returns each classroom with its actual free time windows for that day,
// computed by subtracting real class periods + manual blocks from the
// campus operating hours — not just a whole-day vacant/occupied flag.
const getVacantClassrooms = async (req, res) => {
  try {
    const { day } = req.query;
    if (!day) {
      return res.status(400).json({ message: 'day is required, e.g. ?day=Monday' });
    }

    const classrooms = await Classroom.find({}).sort({ name: 1 });
    const periods = await Timetable.find({ day });

    const dayStart = parseTimeToMinutes(CAMPUS_START);
    const dayEnd = parseTimeToMinutes(CAMPUS_END);

    const result = classrooms.map((room) => {
      const roomIdStr = room._id.toString();

      const roomPeriods = periods.filter((p) => p.room && p.room.toString() === roomIdStr);
      const roomBlocks = (room.manualBlocks || []).filter((b) => b.day === day);

      const occupiedRanges = mergeRanges([
        ...roomPeriods.map((p) => ({
          start: parseTimeToMinutes(p.startTime),
          end: parseTimeToMinutes(p.endTime),
          type: 'class',
          moduleCode: p.moduleCode,
          moduleName: p.moduleName,
        })),
        ...roomBlocks.map((b) => ({
          start: parseTimeToMinutes(b.startTime),
          end: parseTimeToMinutes(b.endTime),
          type: 'blocked',
          reason: b.reason,
        })),
      ]);

      // Free windows = gaps between campus start/end not covered by any occupied range.
      const freeWindows = [];
      let cursor = dayStart;
      for (const occ of occupiedRanges) {
        if (occ.start > cursor) {
          freeWindows.push({ startTime: minutesToTime(cursor), endTime: minutesToTime(occ.start) });
        }
        cursor = Math.max(cursor, occ.end);
      }
      if (cursor < dayEnd) {
        freeWindows.push({ startTime: minutesToTime(cursor), endTime: minutesToTime(dayEnd) });
      }

      // If the requested day is today (real calendar date), figure out
      // whether the room is free right now, and until when.
      const todayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
      let currentStatus = null;
      if (day === todayName) {
        const now = new Date();
        const nowMins = now.getHours() * 60 + now.getMinutes();

        const currentFree = freeWindows.find((w) => {
          const s = parseTimeToMinutes(w.startTime);
          const e = parseTimeToMinutes(w.endTime);
          return nowMins >= s && nowMins < e;
        });

        if (currentFree) {
          currentStatus = { state: 'vacant', until: currentFree.endTime };
        } else {
          const occ = occupiedRanges.find((o) => nowMins >= o.start && nowMins < o.end);
          if (occ) {
            currentStatus = {
              state: occ.type === 'class' ? 'class' : 'blocked',
              until: minutesToTime(occ.end),
              moduleCode: occ.moduleCode,
              moduleName: occ.moduleName,
              reason: occ.reason,
            };
          } else if (nowMins < dayStart || nowMins >= dayEnd) {
            currentStatus = { state: 'closed' };
          }
        }
      }

      return {
        _id: room._id,
        name: room.name,
        capacity: room.capacity,
        facilities: room.facilities,
        freeWindows,
        currentStatus, // null if `day` isn't today — frontend just shows the window list
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