const mongoose = require("mongoose");

// Schema for items
const itemSchema = new mongoose.Schema({
    id: { type: String, required: true }, // Unique identifier for the item
    quantity: { type: Number, required: true },
});

// Schema for custom items
const customItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    length: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    weight: { type: Number, required: true },
    quantity: { type: Number, required: true },
});

// Schema for repeatable job
const repeatJobSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Associated user ID
        items: [itemSchema], // List of standard items
        customItems: [customItemSchema], // List of custom items
        peopleTagging: { type: Number, required: true },
        requiredHelpers: { type: Number, required: true },
        pickupFloor: { type: Number, required: true },
        dropoffFloor: { type: Number, required: true },
        specialRequirements: { type: String },
        jobType: { type: String, required: true },
        moveType: { type: String, required: true },
        isRideAndMove: { type: Boolean, required: true },
        isEventJob: { type: Boolean, required: true },
        originLat: { type: Number, required: true },
        originLong: { type: Number, required: true },
        originName: { type: String, required: true },
        originAddress: { type: String, required: true },
        destinationLat: { type: Number, required: true },
        destinationLong: { type: Number, required: true },
        destinationName: { type: String, required: true },
        destinationAddress: { type: String, required: true },
        passengersCount: { type: Number },
    },
    { timestamps: true } // Automatically add createdAt and updatedAt
);

module.exports = mongoose.model("RepeatJob", repeatJobSchema);
