const mongoose = require('mongoose');

const volunteerOpportunitySchema = new mongoose.Schema(
  {
    // Optional link to a real Event — when set, title/date/organizer are
    // filled in from that event instead of typed manually.
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
    },

    eventTitle: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    date: { type: String, required: true, trim: true },
    slotsAvailable: { type: Number, default: null },
    description: { type: String, trim: true, default: '' },

    organizer: {
      name: { type: String, trim: true, default: '' },
      logo: { type: String, trim: true, default: '' },
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isOpen: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('VolunteerOpportunity', volunteerOpportunitySchema);