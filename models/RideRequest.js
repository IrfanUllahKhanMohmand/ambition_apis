const mongoose = require("mongoose");
const PolyLinePoints = require("./PolyLinePoints");

const rideRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver",
    default: null,
  },
  carDriverId: {
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
  carCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "VehicleCategory",
    default: null,
  },
  moveType: {
    type: String,
    required: true,
  },
  jobType: {
    type: String,
    required: true,
  },
  isRideAndMove: {
    type: Boolean,
    default: false,
  },
  isEventJob: {
    type: Boolean,
    default: false,
  },
  pickupLocation: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], default: [0, 0] },
    name: { type: String, default: "" },
    address: { type: String, default: "" },
  },
  dropoffLocation: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], default: [0, 0] },
    name: { type: String, default: "" },
    address: { type: String, default: "" },
  },
  distance: { type: Number, default: 0 },
  time: { type: Number, default: 0 },
  fare: {
    vehicleInitialServiceFee: { type: Number, default: 0 },
    vehicleBaseFare: { type: Number, default: 0 },
    vehicleTimeFare: { type: Number, default: 0 },
    vehicleItemBasedPricing: { type: Number, default: 0 },
    carInitialServiceFee: { type: Number, default: 0 },
    carBaseFare: { type: Number, default: 0 },
    carTimeFare: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
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
      quantity: { type: Number, default: 1 },
    },
  ],
  requirements: {
    pickupFloor: Number,
    dropoffFloor: Number,
    requiredHelpers: Number,
    peopleTaggingAlong: Number,
    specialRequirements: String,
  },
  passengersCount: { type: Number, default: 0 },

  transactionId: { type: String, default: "" },

  //status differ when isRideAndMove is true. Then it includes for both vehicle and car
  status: {
    type: String,
    enum: [
      "pending",
      "accepted",
      "cancelled",
      "completed",
      "driver_accepted",
      "driver_completed",
      "car_accepted",
      "car_completed",
    ],
    default: "pending",
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("RideRequest", rideRequestSchema);
