const mongoose = require("mongoose");

const instructionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    userType: { type: String, enum: ["driver", "customer"], required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Instruction", instructionSchema);
