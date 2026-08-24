const mongoose = require("mongoose");

const vacantClassroomSchema = new mongoose.Schema(
  {
    roomName: {
      type: String,
      required: true,
      trim: true,
    },

    block: {
      type: String,
      required: true,
      trim: true,
    },

    day: {
      type: String,
      enum: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      required: true,
    },

    capacity: {
      type: Number,
      required: true,
    },

    facilities: {
      type: String,
      default: "",
    },

    availableFrom: {
      type: String,
      required: true,
    },

    availableTo: {
      type: String,
      required: true,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "VacantClassroom",
  vacantClassroomSchema
);