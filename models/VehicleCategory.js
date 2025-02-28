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
  initialServiceFee: { type: Number, default: 0 },
  serviceFee: { type: Number, default: 0 },
  timeFare: [
    {
      startMinutes: {
        type: Number,
        required: true,
      },
      endMinutes: {
        type: Number,
        required: true,
      },
      minPrice: {
        type: Number,
        required: true,
      },
      maxPrice: {
        type: Number,
        required: true,
      }
    }
  ],

  description: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

const VehicleCategory = mongoose.model("VehicleCategory", vehicleCategorySchema)

module.exports = VehicleCategory

