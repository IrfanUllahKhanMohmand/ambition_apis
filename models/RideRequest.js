const mongoose = require("mongoose");
const PolyLinePoints = require("./PolyLinePoints");

const rideRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver",
    default: null,
  },
  polylinePoints: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PolyLinePoints",
    default: null,
  },
  vehicleCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "VehicleCategory",
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
  items: [
    {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
      quantity: Number,
    },
  ],
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
