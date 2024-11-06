const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  qty: {
    type: Number,
  },
});

module.exports = mongoose.model("Item", itemSchema);
