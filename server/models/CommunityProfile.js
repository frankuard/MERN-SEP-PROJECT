const mongoose = require('mongoose');

/**
 * Per-community "About Community" profile. This is the single source of truth
 * for each community's About content — Managed Users (the community account's
 * Manage User → About Community screen) edits it here, and the DevCorps
 * Communities Portal renders the exact same data. Any update made from Managed
 * Users shows up in the Communities Portal automatically.
 *
 * Ids must match the client-side DEV_CORPS_COMMUNITIES / server COMMUNITY_IDS
 * exactly ('ai-horizon', 'devsphere', 'bic-converge', 'lenspire', 'incognitous').
 */
const communityProfileSchema = new mongoose.Schema(
  {
    communityId: { type: String, required: true, unique: true, trim: true },
    communityName: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    purpose: { type: String, default: '' },
    activities: { type: [String], default: [] },
    workshops: { type: [String], default: [] },
    learningAreas: { type: [String], default: [] },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

const CommunityProfile = mongoose.model('CommunityProfile', communityProfileSchema);

module.exports = CommunityProfile;