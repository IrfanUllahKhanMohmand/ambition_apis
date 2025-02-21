const mongoose = require("mongoose")

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
  initialServiceFee: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
  },
  baseFare: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
  },
  timeFare: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
  },

  description: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

const VehicleCategory = mongoose.model("VehicleCategory", vehicleCategorySchema)

module.exports = VehicleCategory

