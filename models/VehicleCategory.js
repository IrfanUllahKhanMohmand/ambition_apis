const mongoose = require("mongoose");

const vehicleCategorySchema = new mongoose.Schema({
  vehicleType: {
    type: String,
    required: true,
    trim: true,
  },
  name: String,
  passengerCapacity: Number,
  payloadCapacity: Number,
  capacity: {
    type: Object, // Size categories and their capacities
    default: {},
  },
  pricing: {
    type: Object, // Size categories and their prices
    default: {},
  },
  loadVolume: Number,
  baseFare: Number,
  timeFare: Number,
  distanceFare: Number,
  description: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("VehicleCategory", vehicleCategorySchema);
