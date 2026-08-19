const mongoose = require('mongoose');

const eventRegistrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    status: {
      type: String,
      enum: ['registered', 'cancelled'],
      default: 'registered',
    },

    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// One user can have only one registration record per event.
eventRegistrationSchema.index(
  { event: 1, user: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  'EventRegistration',
  eventRegistrationSchema
);