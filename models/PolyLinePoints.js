const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const polyLinePointsSchema = new Schema({
  points: [
    {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
  ],
});

module.exports = mongoose.model("PolyLinePoints", polyLinePointsSchema);
