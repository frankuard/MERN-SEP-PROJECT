const mongoose = require('mongoose');

const documentationTaskSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, default: '' },
    completed: { type: Boolean, default: false },
    points: { type: Number, default: 0 },
    maxPoints: { type: Number, default: 10 },
  },
  { _id: false }
);

const documentationEventSchema = new mongoose.Schema(
  {
    order: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    tasks: [documentationTaskSchema],
  },
  { _id: false }
);

const communityDocumentationSchema = new mongoose.Schema(
  {
    communityId: { type: String, required: true, unique: true, index: true },
    events: [documentationEventSchema],
    workshopsDone: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CommunityDocumentation', communityDocumentationSchema);