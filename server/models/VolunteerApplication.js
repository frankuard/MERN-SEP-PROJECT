const mongoose = require('mongoose');

const volunteerApplicationSchema = new mongoose.Schema(
  {
    opportunity: { type: mongoose.Schema.Types.ObjectId, ref: 'VolunteerOpportunity', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['applied', 'withdrawn'], default: 'applied' },
  },
  { timestamps: true }
);

// One application record per student per opportunity (status toggles instead of duplicating)
volunteerApplicationSchema.index({ opportunity: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('VolunteerApplication', volunteerApplicationSchema);