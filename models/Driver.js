const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    phone: String,
    password: String,
    nationalIdFront: String,
    nationalIdBack: String,
    driverLicenseFront: String,
    driverLicenseBack: String,
    profile: String,
    car: {
      category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "VehicleCategory",
      },
      make: String,
      model: String,
      year: Number,
      plate: String,
      color: String,
    },
    status: { type: String, enum: ["online", "offline"], default: "offline" },
    location: {
      type: { type: String, default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "drivers" }
);

// Add a 2dsphere index for geospatial queries
driverSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Driver", driverSchema);
