const mongoose = require("mongoose");

const classroomRequestSchema = new mongoose.Schema(
  {
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VacantClassroom",
      required: true,
    },

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    purpose: {
      type: String,
      required: true,
      trim: true,
    },

    requestDate: {
      type: String,
      required: true,
    },

    requestedFrom: {
      type: String,
      required: true,
    },

    requestedTo: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    adminRemark: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "ClassroomRequest",
  classroomRequestSchema
);