const mongoose = require('mongoose');

const semesterConfigSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      trim: true,
      default: '',
    },
    semester: {
      type: String,
      required: [true, 'Semester is required'],
      trim: true,
    },
    totalDays: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total days cannot be negative'],
    },
  },
  { timestamps: true }
);

semesterConfigSchema.index({ department: 1, semester: 1 }, { unique: true });

const SemesterConfig =
  mongoose.models.SemesterConfig ||
  mongoose.model('SemesterConfig', semesterConfigSchema);

module.exports = SemesterConfig;
