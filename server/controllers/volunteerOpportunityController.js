const VolunteerOpportunity = require('../models/VolunteerOpportunity');
const VolunteerApplication = require('../models/VolunteerApplication');

// ========================================================
// STUDENT
// ========================================================

// GET /volunteer-opportunities
// Returns open opportunities with `applied: true/false` for the logged-in student
const getOpportunities = async (req, res) => {
  try {
    const opportunities = await VolunteerOpportunity.find({ isOpen: true }).sort({ createdAt: -1 });

    let appliedIds = new Set();
    if (req.user?._id) {
      const myApplications = await VolunteerApplication.find({
        student: req.user._id,
        status: 'applied',
      }).select('opportunity');
      appliedIds = new Set(myApplications.map((a) => a.opportunity.toString()));
    }

    const formatted = opportunities.map((o) => ({
      ...o.toObject(),
      applied: appliedIds.has(o._id.toString()),
    }));

    res.status(200).json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /volunteer-opportunities/:id/apply   body: { apply: true | false }
const applyToOpportunity = async (req, res) => {
  try {
    const { apply } = req.body;
    const opportunity = await VolunteerOpportunity.findById(req.params.id);
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });

    if (apply && opportunity.slotsAvailable !== null) {
      const count = await VolunteerApplication.countDocuments({
        opportunity: opportunity._id,
        status: 'applied',
      });
      if (count >= opportunity.slotsAvailable) {
        return res.status(400).json({ message: 'No slots available for this opportunity' });
      }
    }

    const existing = await VolunteerApplication.findOne({
      opportunity: opportunity._id,
      student: req.user._id,
    });

    let application;
    if (existing) {
      existing.status = apply ? 'applied' : 'withdrawn';
      application = await existing.save();
    } else {
      application = await VolunteerApplication.create({
        opportunity: opportunity._id,
        student: req.user._id,
        status: apply ? 'applied' : 'withdrawn',
      });
    }

    res.status(200).json({ success: true, applied: apply, application });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid opportunity ID' });
    res.status(500).json({ message: err.message });
  }
};

// ========================================================
// ADMIN
// ========================================================

const createOpportunity = async (req, res) => {
  try {
    const { eventTitle, role, date, slotsAvailable, description } = req.body;
    if (!eventTitle || !role || !date) {
      return res.status(400).json({ message: 'eventTitle, role, and date are required' });
    }
    const opportunity = await VolunteerOpportunity.create({
      eventTitle: eventTitle.trim(),
      role: role.trim(),
      date: date.trim(),
      slotsAvailable: slotsAvailable ?? null,
      description: description?.trim() || '',
      createdBy: req.user._id,
    });
    res.status(201).json(opportunity);
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

const updateOpportunity = async (req, res) => {
  try {
    const opportunity = await VolunteerOpportunity.findById(req.params.id);
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });

    const { eventTitle, role, date, slotsAvailable, description, isOpen } = req.body;
    if (eventTitle !== undefined) opportunity.eventTitle = eventTitle.trim();
    if (role !== undefined) opportunity.role = role.trim();
    if (date !== undefined) opportunity.date = date.trim();
    if (slotsAvailable !== undefined) opportunity.slotsAvailable = slotsAvailable;
    if (description !== undefined) opportunity.description = description.trim();
    if (isOpen !== undefined) opportunity.isOpen = isOpen;

    const updated = await opportunity.save();
    res.status(200).json(updated);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid opportunity ID' });
    res.status(500).json({ message: err.message });
  }
};

const deleteOpportunity = async (req, res) => {
  try {
    const opportunity = await VolunteerOpportunity.findByIdAndDelete(req.params.id);
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });
    await VolunteerApplication.deleteMany({ opportunity: opportunity._id });
    res.status(200).json({ message: 'Opportunity deleted' });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid opportunity ID' });
    res.status(500).json({ message: err.message });
  }
};

// GET /volunteer-opportunities/admin/all — includes closed ones
const getAllOpportunitiesAdmin = async (req, res) => {
  try {
    const opportunities = await VolunteerOpportunity.find({}).sort({ createdAt: -1 });
    res.status(200).json(opportunities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /volunteer-opportunities/:id/applicants
const getOpportunityApplicants = async (req, res) => {
  try {
    const opportunity = await VolunteerOpportunity.findById(req.params.id).select('eventTitle role date');
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });

    const applications = await VolunteerApplication.find({
      opportunity: req.params.id,
      status: 'applied',
    })
      .populate('student', 'username email department')
      .sort({ createdAt: 1 });

    res.status(200).json({
      opportunity,
      count: applications.length,
      applicants: applications.map((a) => ({ applicationId: a._id, appliedAt: a.createdAt, student: a.student })),
    });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid opportunity ID' });
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getOpportunities,
  applyToOpportunity,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  getAllOpportunitiesAdmin,
  getOpportunityApplicants,
};