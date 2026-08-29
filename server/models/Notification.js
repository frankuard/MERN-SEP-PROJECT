const mongoose = require('mongoose');

// Every trigger type from the plan. Add new ones here as we wire more modules —
// nothing else needs to change to support a new type, it's just a label.
const NOTIFICATION_TYPES = [
  'announcement',
  'attendance',           // your attendance record was edited
  'attendance_report',    // your attendance report/correction request was approved/rejected
  'volunteer_opportunity',
  'timetable',            // your schedule change request was approved/rejected
  'department',           // new campus-help department added
  'canteen_menu',         // menu item added/edited
  'canteen_credit',       // your credit due changed / payment recorded
  'book',                 // book added/edited in library catalog
  'book_request',         // your borrow request approved/pending/rejected
  'sports_item',          // sports item added/edited
  'sports_request',       // your sports equipment request approved/rejected
  'lost_found',           // someone posted a lost/found item
  'cctv_request',         // your CCTV footage request approved/rejected
  'profile_update',       // your user profile was edited by an admin
  'classroom_request',    // your classroom/room request approved/rejected
  'event', // for the event
  'campus_help',           // new peer help request posted
  'general',               // fallback / anything not covered above
];

const notificationSchema = new mongoose.Schema(
  {
    // Who this notification is for. Always a single user — broadcasts (e.g. "notify
    // all students") just create one of these per recipient via the helper.
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    // Optional frontend route to send the user to when they click the notification,
    // e.g. '/dashboard?tab=attendance'
    link: {
      type: String,
      default: '',
    },

    read: {
      type: Boolean,
      default: false,
    },

    // Free-form extra data a specific trigger might want to carry along
    // (e.g. { announcementId }, { previousStatus, newStatus }) without needing
    // a schema change every time. Not required, not displayed unless the frontend chooses to.
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Powers the two most common queries: "give me this user's inbox, newest first"
// and "give me this user's unread count" — both filter by recipient (+read) and sort by date.
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

const Notification =
  mongoose.models.Notification ||
  mongoose.model('Notification', notificationSchema);

module.exports = Notification;
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;