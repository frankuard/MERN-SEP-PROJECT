const Timetable = require('../models/Timetable');

/**
 * @desc   Get all timetable classes with optional search/filtering
 * @route  GET /api/timetable
 * @access Public / Authenticated
 */
const getTimetable = async (req, res) => {
  try {
    const { day, teacher, courseCode, room, classType, search, format } = req.query;

    const filter = {};

    if (day) {
      filter.day = { $regex: new RegExp(`^${day}$`, 'i') };
    }
    if (teacher) {
      filter.teacher = { $regex: teacher, $options: 'i' };
    }
    if (courseCode) {
      filter.courseCode = { $regex: courseCode, $options: 'i' };
    }
    if (room) {
      filter.room = { $regex: room, $options: 'i' };
    }
    if (classType) {
      filter.classType = { $regex: new RegExp(`^${classType}$`, 'i') };
    }
    if (search) {
      filter.$or = [
        { courseCode: { $regex: search, $options: 'i' } },
        { courseName: { $regex: search, $options: 'i' } },
        { teacher: { $regex: search, $options: 'i' } },
        { room: { $regex: search, $options: 'i' } },
      ];
    }

    const classes = await Timetable.find(filter).sort({ createdAt: 1 });

    // If frontend requests routine grouped by days (Sunday to Saturday)
    if (format === 'grouped' || req.query.group) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const groupedRoutine = days.map((d) => {
        const dayClasses = classes.filter((c) => c.day.toLowerCase() === d.toLowerCase());
        return {
          day: d,
          isOffDay: dayClasses.length === 0,
          periods: dayClasses.map((c) => ({
            id: c._id,
            time: `${c.startTime} – ${c.endTime}`,
            startTime: c.startTime,
            endTime: c.endTime,
            classType: c.classType,
            moduleCode: c.courseCode,
            moduleName: c.courseName,
            lecturer: c.teacher,
            room: c.room,
          })),
        };
      });

      return res.status(200).json(groupedRoutine);
    }

    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch timetable', error: error.message });
  }
};

/**
 * @desc   Get single timetable class by ID
 * @route  GET /api/timetable/:id
 * @access Public / Authenticated
 */
const getClassById = async (req, res) => {
  try {
    const classItem = await Timetable.findById(req.params.id);
    if (!classItem) {
      return res.status(404).json({ message: 'Timetable class not found' });
    }
    res.status(200).json(classItem);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch class', error: error.message });
  }
};

/**
 * @desc   Create new timetable class
 * @route  POST /api/timetable
 * @access Private (Admin / Staff)
 */
const createClass = async (req, res) => {
  try {
    const { day, startTime, endTime, courseCode, courseName, teacher, room, classType } = req.body;

    if (!day || !startTime || !endTime || !courseCode || !courseName || !teacher || !room) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const newClass = await Timetable.create({
      day,
      startTime,
      endTime,
      courseCode,
      courseName,
      teacher,
      room,
      classType: classType || 'Lecture',
    });

    res.status(201).json({ message: 'Class session added successfully', class: newClass });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create class', error: error.message });
  }
};

/**
 * @desc   Update timetable class
 * @route  PUT /api/timetable/:id
 * @access Private (Admin / Staff)
 */
const updateClass = async (req, res) => {
  try {
    const classItem = await Timetable.findById(req.params.id);
    if (!classItem) {
      return res.status(404).json({ message: 'Timetable class not found' });
    }

    const updatedClass = await Timetable.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.status(200).json({ message: 'Class session updated successfully', class: updatedClass });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update class', error: error.message });
  }
};

/**
 * @desc   Delete timetable class
 * @route  DELETE /api/timetable/:id
 * @access Private (Admin / Staff)
 */
const deleteClass = async (req, res) => {
  try {
    const classItem = await Timetable.findById(req.params.id);
    if (!classItem) {
      return res.status(404).json({ message: 'Timetable class not found' });
    }

    await Timetable.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Class session deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete class', error: error.message });
  }
};

module.exports = {
  getTimetable,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
};
