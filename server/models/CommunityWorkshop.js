const mongoose = require('mongoose');

/**
 * Workshops released by a community portal account. Each community owns and
 * manages only its own workshops — everything is scoped by `communityId` so
 * the five communities' data never leaks into each other. The workshops are
 * surfaced to campus users only after they have an approved membership in
 * that community.
 */
const communityWorkshopSchema = new mongoose.Schema(
  {
    communityId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    communityName: {
      type: String,
      required: true,
      trim: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: '',
      trim: true,
    },

    date: {
      type: String,
      default: '',
      trim: true,
    },

    time: {
      type: String,
      default: '',
      trim: true,
    },

    venue: {
      type: String,
      default: '',
      trim: true,
    },

    // Workshop banner/image URL (ImageKit when uploaded, otherwise any URL).
    image: {
      type: String,
      default: '',
    },

    instructor: {
      type: String,
      default: '',
      trim: true,
    },

    capacity: {
      type: Number,
      default: 0,
    },

    duration: {
      type: String,
      default: '',
      trim: true,
    },

    // The community portal account that released this workshop.
    releasedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Newest first is the common reading order for both the community portal
// (own released list) and the user panel (Community > Community Workshops).
communityWorkshopSchema.index({ communityId: 1, createdAt: -1 });

const CommunityWorkshop =
  mongoose.models.CommunityWorkshop ||
  mongoose.model('CommunityWorkshop', communityWorkshopSchema);

module.exports = CommunityWorkshop;