const mongoose = require("mongoose");

const rideSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
  pickupLocation: String,
  dropoffLocation: String,
  status: {
    type: String,
    enum: ["pending", "ongoing", "completed", "canceled"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Ride", rideSchema);
