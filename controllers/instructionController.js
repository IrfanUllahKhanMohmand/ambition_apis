const Instruction = require("../models/instructionModel");

// Create a new instruction
exports.createInstruction = async (req, res) => {
    try {
        const { title, description, userType } = req.body;
        if (!["driver", "customer"].includes(userType)) {
            return res.status(400).json({ message: "Invalid user type. Must be 'driver' or 'customer'." });
        }
        const instruction = new Instruction({ title, description, userType });
        await instruction.save();
        res.status(201).json({ message: "Instruction created successfully", instruction });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all instructions
exports.getAllInstructions = async (req, res) => {
    try {
        const instructions = await Instruction.find();
        res.status(200).json(instructions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a single instruction by ID
exports.getInstructionById = async (req, res) => {
    try {
        const instruction = await Instruction.findById(req.params.id);
        if (!instruction) return res.status(404).json({ message: "Instruction not found" });
        res.status(200).json(instruction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get instructions by user type
exports.getInstructionsByUserType = async (req, res) => {
    try {
        const instructions = await Instruction.find({ userType: req.params.userType });
        res.status(200).json(instructions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update an instruction
exports.updateInstruction = async (req, res) => {
    try {
        const { title, description, userType } = req.body;
        const instruction = await Instruction.findByIdAndUpdate(
            req.params.id,
            { title, description, userType },
            { new: true }
        );
        if (!instruction) return res.status(404).json({ message: "Instruction not found" });
        res.status(200).json({ message: "Instruction updated successfully", instruction });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete an instruction
exports.deleteInstruction = async (req, res) => {
    try {
        const instruction = await Instruction.findByIdAndDelete(req.params.id);
        if (!instruction) return res.status(404).json({ message: "Instruction not found" });
        res.status(200).json({ message: "Instruction deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
