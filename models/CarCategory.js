const mongoose = require("mongoose");

const carCategorySchema = new mongoose.Schema({
  name: String,
  maxCapacity: Number,
  description: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("CarCategory", carCategorySchema);
