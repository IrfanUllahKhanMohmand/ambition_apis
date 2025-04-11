const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    phone: { type: String, unique: true },
    otp: { type: String },
    otpExpires: { type: Date },
    driverLicenseFront: String,
    driverLicenseBack: String,
    licenseCheckCode: { type: String, default: "" },
    licensePlatePicture: { type: String, default: "" },
    vehicleFrontPicture: { type: String, default: "" },
    vehicleBackPicture: { type: String, default: "" },
    vehicleLeftPicture: { type: String, default: "" },
    vehicleRightPicture: { type: String, default: "" },
    vehicleInsurancePicture: { type: String, default: "" },
    publicLiabilityInsurancePicture: { type: String, default: "" },
    goodsInTransitInsurancePicture: { type: String, default: "" },
    pcoLicensePicture: { type: String, default: "" },

    //Bank Details
    accountName: { type: String, default: "" },
    accountNumber: { type: String, default: "" },
    accountSortCode: { type: String, default: "" },

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
    isDisabled: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "drivers" }
);

// Add a 2dsphere index for geospatial queries
driverSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Driver", driverSchema);
