const mongoose = require("mongoose");

const rideRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver",
    default: null,
  },
  moveType: {
    type: String,
    required: true,
  },
  pickupLocation: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], default: [0, 0] },
  },
  dropoffLocation: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], default: [0, 0] },
  },
  distance: { type: Number, default: 0 },
  fare: { type: Number, default: 0 },
  items: [{ type: mongoose.Schema.Types.ObjectId, ref: "Item" }],
  customItems: [
    {
      name: String,
      length: Number,
      width: Number,
      height: Number,
      weight: Number,
    },
  ],
  requirements: {
    pickupFloor: Number,
    dropoffFloor: Number,
    requiredHelpers: Number,
    peopleTaggingAlong: Number,
    specialRequirements: String,
  },
  status: {
    type: String,
    enum: ["pending", "ongoing", "completed", "canceled"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("RideRequest", rideRequestSchema);
