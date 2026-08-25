const mongoose = require('mongoose');

const scheduleChangeSchema = new mongoose.Schema(
  {
    // Link to the real period this change is about. Admin picks this from
    // a list (populated from Timetable) instead of typing module info.
    period: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Timetable',
      required: [true, 'Original period is required'],
    },

    // Snapshot fields copied from the period at creation time, so the card
    // still displays correctly even if the original period is later edited
    // or deleted.
    moduleCode: { type: String, required: true, trim: true },
    moduleName: { type: String, required: true, trim: true },
    classType: { type: String, required: true, trim: true },
    group: { type: String, trim: true, default: '' },
    originalDay: { type: String, required: true, trim: true },
    originalStartTime: { type: String, required: true, trim: true },
    originalEndTime: { type: String, required: true, trim: true },
    originalRoom: { type: String, required: true, trim: true },

    // What's changing. Only the fields relevant to `status` need to be
    // filled in on the frontend (e.g. Cancelled only needs a reason).
    newDay: { type: String, trim: true, default: '' },
    newStartTime: { type: String, trim: true, default: '' },
    newEndTime: { type: String, trim: true, default: '' },
    newRoom: { type: String, trim: true, default: '' },

    reason: {
      type: String,
      trim: true,
      default: '',
    },
    effectiveDate: {
      type: String, // display string ("Aug 24, 2026"), matches existing UI
      required: [true, 'Effective date is required'],
      trim: true,
    },
    publishedBy: {
      type: String,
      trim: true,
      default: 'RTE Department (Registry & Timetabling)',
    },
    status: {
      type: String,
      enum: ['Time Changed', 'Room Changed', 'Rescheduled', 'Cancelled'],
      required: true,
    },
    badgeColor: {
      type: String,
      enum: ['amber', 'blue', 'purple', 'red'],
      default: 'amber',
    },
    isActive: {
      type: Boolean,
      default: true, // admin can archive old changes instead of deleting
    },
  },
  { timestamps: true }
);

const ScheduleChange = mongoose.models.ScheduleChange || mongoose.model('ScheduleChange', scheduleChangeSchema);

module.exports = ScheduleChange;