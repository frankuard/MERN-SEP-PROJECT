const mongoose = require('mongoose');

/**
 * A community event request submitted by one of the five member communities
 * (AI Horizon, DevSphere, BIC Converge, Lenspire, Incognitous) for the
 * DevCorps community admin to approve or reject.
 *
 * Only ever created by a devcorpsCommunity portal member and only reviewed
 * by the devcorpsCommunity portal admin. On approval, the controller turns
 * this into a real Event (published to the shared Event Board), reusing the
 * exact same Event document the rest of the campus sees.
 */
const eventRequestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ['college', 'community'],
      required: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: Date,
      required: true,
    },

    startTime: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      default: '',
    },

    venue: {
      type: String,
      required: true,
      trim: true,
    },

    eventImage: {
      type: String,
      default: '',
    },

    // Organizer is captured from the requesting community at submit time so
    // the approved Event lands on the board with the correct organizer.
    organizer: {
      name: {
        type: String,
        required: true,
        trim: true,
      },

      logo: {
        type: String,
        default: '',
      },
    },

    // The community account that submitted the request.
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },

    // Optional note written by DevCorps when rejecting (or approving).
    reviewNote: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('EventRequest', eventRequestSchema);
