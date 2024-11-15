const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
  vehicleCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "VehicleCategory",
    required: true,
  },
  vehicleName: {
    type: String,
    required: true,
    trim: true,
  },
  make: {
    type: String,
    required: true,
    trim: true,
  },
});

module.exports = mongoose.model("Vehicle", vehicleSchema);
