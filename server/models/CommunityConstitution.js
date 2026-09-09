const mongoose = require('mongoose');

// One Constitution per community. The communityId is unique, so uploading a
// new file REPLACES the previous one (old file is removed from storage and
// the version counter advances). Members read only; the owning community
// account (and the DevCorps portal admin) can upload/replace/delete.
const communityConstitutionSchema = new mongoose.Schema(
  {
    communityId: { type: String, required: true, unique: true, index: true },
    communityName: { type: String, default: '' },
    fileName: { type: String, required: true },
    url: { type: String, required: true },
    fileId: { type: String, default: '' },
    size: { type: Number, default: 0 },
    mimetype: { type: String, default: '' },
    version: { type: Number, default: 1 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CommunityConstitution', communityConstitutionSchema);