const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  password: String,
  nationalIdFront: String,
  nationalIdBack: String,
  driverLicenseFront: String,
  driverLicenseBack: String,
  profilePicture: String,
  car: { type: mongoose.Schema.Types.ObjectId, ref: "Car" },
  status: { type: String, enum: ["online", "offline"], default: "offline" },
  location: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Driver", driverSchema);
