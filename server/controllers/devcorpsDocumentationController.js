const CommunityDocumentation = require('../models/CommunityDocumentation');
const CommunityFile = require('../models/CommunityFile');
const { getImageKit, isImageKitConfigured } = require('../config/imagekit');

const VALID_COMMUNITY_IDS = [
  'ai-horizon',
  'devsphere',
  'bic-converge',
  'lenspire',
  'incognitous',
];

const isValidCommunityId = (id) => VALID_COMMUNITY_IDS.includes(id);

const DEFAULT_EVENT_TITLES = [
  'Orientation / Induction Event',
  'Workshop & Training',
  'Competition / Contest',
  'Showcase / Exhibition',
];

const TASK_TEMPLATE = [
  { key: 'planning', label: 'Event planning / proposal submission' },
  { key: 'journal', label: 'Journal / report submission' },
  { key: 'budget', label: 'Budget submission' },
  { key: 'registration', label: 'Registration submission' },
  { key: 'feedback', label: 'Feedback submission' },
  { key: 'constitution', label: 'Community constitution submission' },
  { key: 'social', label: 'Social media promotion / check' },
  { key: 'other', label: 'Other required documentation' },
];

const buildDefaultEvents = () =>
  DEFAULT_EVENT_TITLES.map((title, index) => ({
    order: index + 1,
    title,
    tasks: TASK_TEMPLATE.map((task) => ({
      ...task,
      completed: false,
      points: 0,
      maxPoints: 10,
    })),
  }));

const getOrCreateBoard = async (communityId) => {
  let board = await CommunityDocumentation.findOne({ communityId });
  if (!board) {
    board = await CommunityDocumentation.create({
      communityId,
      events: buildDefaultEvents(),
    });
  }
  return board;
};

// GET /api/devcorps/documentation/:communityId
const getBoard = async (req, res) => {
  try {
    const { communityId } = req.params;
    if (!isValidCommunityId(communityId)) {
      return res.status(400).json({ message: 'Unknown community' });
    }
    const board = await getOrCreateBoard(communityId);
    res.status(200).json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/devcorps/documentation/:communityId/events/:order — rename an event
const renameEvent = async (req, res) => {
  try {
    const { communityId, order } = req.params;
    const { title } = req.body;
    if (!isValidCommunityId(communityId)) {
      return res.status(400).json({ message: 'Unknown community' });
    }
    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ message: 'Event title is required' });
    }

    const board = await getOrCreateBoard(communityId);
    const event = board.events.find((e) => e.order === Number(order));
    if (!event) return res.status(400).json({ message: 'Invalid event' });

    event.title = title.trim();
    await board.save();
    res.status(200).json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/devcorps/documentation/:communityId/events/:order/tasks/:key
const updateTask = async (req, res) => {
  try {
    const { communityId, order, key } = req.params;
    const { completed, points } = req.body;
    if (!isValidCommunityId(communityId)) {
      return res.status(400).json({ message: 'Unknown community' });
    }

    const board = await getOrCreateBoard(communityId);
    const event = board.events.find((e) => e.order === Number(order));
    if (!event) return res.status(400).json({ message: 'Invalid event' });

    const task = event.tasks.find((t) => t.key === key);
    if (!task) return res.status(400).json({ message: 'Invalid task' });

    if (typeof completed === 'boolean') task.completed = completed;
    if (points !== undefined) {
      const numeric = Number(points);
      if (!Number.isFinite(numeric)) {
        return res.status(400).json({ message: 'Invalid points value' });
      }
      task.points = Math.min(Math.max(numeric, 0), task.maxPoints);
    }

    await board.save();
    res.status(200).json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/devcorps/documentation/:communityId/files
const listFiles = async (req, res) => {
  try {
    const { communityId } = req.params;
    if (!isValidCommunityId(communityId)) {
      return res.status(400).json({ message: 'Unknown community' });
    }
    const files = await CommunityFile.find({ communityId })
      .sort({ createdAt: -1 })
      .select('-__v');
    res.status(200).json(files);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/devcorps/documentation/:communityId/files (multipart, field: 'file')
const uploadFile = async (req, res) => {
  try {
    const { communityId } = req.params;
    if (!isValidCommunityId(communityId)) {
      return res.status(400).json({ message: 'Unknown community' });
    }
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    if (!isImageKitConfigured()) {
      return res.status(503).json({
        message: 'Upload is not configured. Add ImageKit environment variables.',
      });
    }

    const imagekit = getImageKit();
    const result = await imagekit.upload({
      file: req.file.buffer.toString('base64'),
      fileName: req.file.originalname,
      folder: `/devcorps-documentation/${communityId}`,
    });

    const record = await CommunityFile.create({
      communityId,
      fileName: req.file.originalname,
      url: result.url,
      fileId: result.fileId || '',
      size: req.file.size,
      mimetype: req.file.mimetype,
      points: 0,
      uploadedBy: req.user._id,
    });

    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/devcorps/documentation/files/:fileId — update points
const updateFilePoints = async (req, res) => {
  try {
    const file = await CommunityFile.findById(req.params.fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });

    const points = Number(req.body.points);
    if (!Number.isFinite(points)) {
      return res.status(400).json({ message: 'Invalid points value' });
    }

    file.points = Math.max(points, 0);
    await file.save();
    res.status(200).json(file);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid file ID' });
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/devcorps/documentation/files/:fileId
const deleteFile = async (req, res) => {
  try {
    const file = await CommunityFile.findById(req.params.fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });

    if (file.fileId && isImageKitConfigured()) {
      try {
        await getImageKit().deleteFile(file.fileId);
      } catch (err) {
        console.error('ImageKit delete failed (non-fatal):', err.message);
      }
    }

    await file.deleteOne();
    res.status(200).json({ message: 'File deleted' });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid file ID' });
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getBoard,
  renameEvent,
  updateTask,
  listFiles,
  uploadFile,
  updateFilePoints,
  deleteFile,
};