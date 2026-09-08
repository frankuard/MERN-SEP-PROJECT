const mongoose = require('mongoose');

const communityFileSchema = new mongoose.Schema(
  {
    communityId: { type: String, required: true, index: true },
    fileName: { type: String, required: true },
    url: { type: String, required: true },
    fileId: { type: String, default: '' },
    size: { type: Number, default: 0 },
    mimetype: { type: String, default: '' },
    points: { type: Number, default: 0 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CommunityFile', communityFileSchema);