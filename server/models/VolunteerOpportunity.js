const mongoose = require('mongoose');

const volunteerOpportunitySchema = new mongoose.Schema(
  {
    eventTitle: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true }, // e.g. "Registration Desk"
    date: { type: String, required: true, trim: true }, // display string
    slotsAvailable: { type: Number, default: null }, // null = unlimited
    description: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isOpen: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('VolunteerOpportunity', volunteerOpportunitySchema);