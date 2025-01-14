const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  itemType: {
    type: String,
    required: true,
    trim: true,
  },
  length: Number,
  width: Number,
  height: Number,
  weight: Number,
});

module.exports = mongoose.model("Item", itemSchema);
