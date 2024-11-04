const mongoose = require("mongoose");

const carSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "CarCategory" },
  make: String,
  model: String,
  year: Number,
  licensePlate: String,
  capacity: Number,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Car", carSchema);
