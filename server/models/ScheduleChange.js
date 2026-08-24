const mongoose = require('mongoose');

const scheduleChangeSchema = new mongoose.Schema(
  {
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
    classType: {
      type: String,
      enum: ['Lecture', 'Tutorial', 'Workshop'],
      required: true,
    },
    group: {
      type: String,
      trim: true,
      default: '',
    },
    originalSchedule: {
      type: String,
      required: [true, 'Original schedule is required'],
      trim: true,
    },
    newSchedule: {
      type: String,
      required: [true, 'New schedule is required'],
      trim: true,
    },
    reason: {
      type: String,
      trim: true,
      default: '',
    },
    effectiveDate: {
      type: String, // stored as display string ("Aug 24, 2026") to match how it's shown
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