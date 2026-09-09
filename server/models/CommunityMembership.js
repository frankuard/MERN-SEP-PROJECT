const mongoose = require('mongoose');

/**
 * Membership requests between the five commmunity portal accounts and the
 * campus users they invite. One record per (community, user) pair.
 *
 * status:
 *   pending  — community sent the request, user hasn't responded yet
 *   accepted — user approved; the member gets a Community section in their
 *              sidebar and can see released workshops from that community
 *   rejected — user declined; no Community section is added and re-sends are
 *              allowed
 */
const communityMembershipSchema = new mongoose.Schema(
  {
    // Canonical community id, matching client DEV_CORPS_COMMUNITIES ids
    // exactly (e.g. 'ai-horizon', 'devsphere', ...).
    communityId: {
      type: String,
      required: true,
      trim: true,
    },

    communityName: {
      type: String,
      required: true,
      trim: true,
    },

    // The campus user (student/teacher/staff) the community invited.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },

    // The community portal account that sent the request — used only to
    // notify the right person when the user accepts/rejects.
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// A community can never have more than one membership line with a user.
communityMembershipSchema.index({ communityId: 1, user: 1 }, { unique: true });

const CommunityMembership =
  mongoose.models.CommunityMembership ||
  mongoose.model('CommunityMembership', communityMembershipSchema);

module.exports = CommunityMembership;