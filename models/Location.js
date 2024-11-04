const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
  latitude: Number,
  longitude: Number,
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Location", locationSchema);
