const mongoose = require('mongoose');

const courseworkAttachmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    fileType: { type: String, default: '' },
    size: { type: Number, default: 0 },
  },
  { _id: false }
);

const courseworkSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Coursework title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description/instructions are required'],
      trim: true,
    },
    moduleCode: {
      type: String,
      required: [true, 'Module code is required'],
      trim: true,
    },
    moduleName: {
      type: String,
      required: [true, 'Module name is required'],
      trim: true,
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
    },
    targetGroup: {
      type: String,
      required: [true, 'Target group is required'],
      trim: true, // e.g. "L4CG2" or "L5CG1"
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    teacherName: {
      type: String,
      required: true,
      trim: true,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    totalMarks: {
      type: Number,
      default: 100,
      min: [1, 'Total marks must be at least 1'],
    },
    attachments: {
      type: [courseworkAttachmentSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'closed', 'draft'],
      default: 'active',
    },
  },
  { timestamps: true }
);

// Index for quick queries by target group and teacher
courseworkSchema.index({ targetGroup: 1, createdAt: -1 });
courseworkSchema.index({ teacher: 1, createdAt: -1 });

const Coursework =
  mongoose.models.Coursework || mongoose.model('Coursework', courseworkSchema);

module.exports = Coursework;
