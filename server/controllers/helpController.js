const HelpRequest = require('../models/HelpRequest');
const DepartmentContact = require('../models/DepartmentContact');
const User = require('../models/User');
const { createNotificationForRole } = require('../utils/createNotification');


const resolveUserId = (req) => req.user?.userId || req.user?.id || req.user?._id;

/**
 * 1. Get all peer help requests (newest first)
 * GET /api/campus-help/requests
 */
const getHelpRequests = async (req, res) => {
  try {
    const requests = await HelpRequest.find({})
      .populate('requester', 'username email department semester')
      .populate('responses.user', 'username email')
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * 2. Create a new peer help request
 * POST /api/campus-help/requests
 */
const createHelpRequest = async (req, res) => {
  try {
    const { request, attachments } = req.body;

    if (!request || !request.trim()) {
      return res.status(400).json({ message: 'Request text is required' });
    }

    const userId = resolveUserId(req);
    const user = await User.findById(userId);

    const newRequest = await HelpRequest.create({
      requester: userId,
      requesterName: user?.username || 'Student',
      requesterSem: user?.semester ? `Sem ${user.semester}` : 'Student',
      request: request.trim(),
      attachments: Array.isArray(attachments) ? attachments : [],
    });

    const populated = await HelpRequest.findById(newRequest._id)
      .populate('requester', 'username email department semester');

    createNotificationForRole(['staff', 'admin'], {
      type: 'campus_help',
      title: 'New Peer Help Request',
      message: `${newRequest.requesterName} asked: "${newRequest.request}"`,
      link: 'campus-help',
    }, userId);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * 3. Add a response to a help request
 * POST /api/campus-help/requests/:id/responses
 */
const addResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, attachments } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Response message is required' });
    }

    const helpRequest = await HelpRequest.findById(id);
    if (!helpRequest) return res.status(404).json({ message: 'Help request not found' });

    const userId = resolveUserId(req);
    const user = await User.findById(userId);

    helpRequest.responses.push({
      user: userId,
      userName: user?.username || 'Student',
      message: message.trim(),
      attachments: Array.isArray(attachments) ? attachments : [],
    });

    await helpRequest.save();

    const populated = await HelpRequest.findById(id)
      .populate('requester', 'username email department semester')
      .populate('responses.user', 'username email');

    res.status(200).json(populated);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid request ID' });
    res.status(500).json({ message: err.message });
  }
};

/**
 * 4. Delete a help request (owner or staff/admin)
 * DELETE /api/campus-help/requests/:id
 */
const deleteHelpRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const helpRequest = await HelpRequest.findById(id);
    if (!helpRequest) return res.status(404).json({ message: 'Help request not found' });

    const userId = resolveUserId(req);
    const isOwner = helpRequest.requester && helpRequest.requester.toString() === userId;
    const isStaffOrAdmin = ['staff', 'admin'].includes(req.user.role);

    if (!isOwner && !isStaffOrAdmin) {
      return res.status(403).json({ message: 'Unauthorized to delete this request' });
    }

    await HelpRequest.findByIdAndDelete(id);
    res.status(200).json({ message: 'Help request deleted', id });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid request ID' });
    res.status(500).json({ message: err.message });
  }
};

/**
 * 5. Get all department contact cards (sorted)
 * GET /api/campus-help/departments
 */
const getDepartments = async (req, res) => {
  try {
    const departments = await DepartmentContact.find({}).sort({ order: 1 });
    res.status(200).json(departments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * 6. Create a new department contact (admin)
 * POST /api/campus-help/departments
 */
const createDepartment = async (req, res) => {
  try {
    const { key, title, icon, phone, phoneHref, email, emailHref, order } = req.body;

    if (!key || !title || !phone || !email) {
      return res.status(400).json({ message: 'key, title, phone, and email are required' });
    }

    const department = await DepartmentContact.create({
      key: key.trim().toLowerCase(),
      title: title.trim(),
      icon: icon || 'Building2',
      phone: phone.trim(),
      phoneHref: phoneHref || `tel:${phone.replace(/\s+/g, '')}`,
      email: email.trim(),
      emailHref: emailHref || `mailto:${email.trim()}`,
      order: typeof order === 'number' ? order : 0,
    });

    createNotificationForRole('student', {
      type: 'department',
      title: 'New Department Contact Added',
      message: `${department.title} contact info is now available`,
      link: 'campus-help',
    });

    res.status(201).json(department);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'A department with this key already exists' });
    }
    res.status(500).json({ message: err.message });
  }
};

/**
 * 7. Update a department contact (admin)
 * PATCH /api/campus-help/departments/:id
 */
const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const department = await DepartmentContact.findById(id);
    if (!department) return res.status(404).json({ message: 'Department not found' });

    const { title, icon, phone, phoneHref, email, emailHref, order } = req.body;

    if (title !== undefined) department.title = title.trim();
    if (icon !== undefined) department.icon = icon;
    if (phone !== undefined) department.phone = phone.trim();
    if (phoneHref !== undefined) department.phoneHref = phoneHref;
    if (email !== undefined) department.email = email.trim();
    if (emailHref !== undefined) department.emailHref = emailHref;
    if (order !== undefined) department.order = order;

    await department.save();

    createNotificationForRole('student', {
      type: 'department',
      title: 'Department Contact Updated',
      message: `${department.title} contact info was updated`,
      link: 'campus-help',
    });

    res.status(200).json(department);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid department ID' });
    res.status(500).json({ message: err.message });
  }
};

/**
 * 8. Delete a department contact (admin)
 * DELETE /api/campus-help/departments/:id
 */
const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const department = await DepartmentContact.findById(id);
    if (!department) return res.status(404).json({ message: 'Department not found' });

    await DepartmentContact.findByIdAndDelete(id);
    res.status(200).json({ message: 'Department deleted', id });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid department ID' });
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getHelpRequests,
  createHelpRequest,
  addResponse,
  deleteHelpRequest,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};