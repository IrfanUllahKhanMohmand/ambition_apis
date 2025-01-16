const RepeatJob = require("../models/RepeatJobModel");

// Create a new repeatable job
exports.createRepeatJob = async (req, res) => {
    try {
        const jobData = req.body;
        const repeatJob = await RepeatJob.create(jobData);
        res.status(201).json({ success: true, data: repeatJob });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get all repeatable jobs for a user
exports.getRepeatJobsByUserId = async (req, res) => {
    try {
        const repeatJobs = await RepeatJob.find({ userId: req.params.userId });
        res.status(200).json({ success: true, data: repeatJobs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Update a repeatable job
exports.updateRepeatJob = async (req, res) => {
    try {
        const repeatJob = await RepeatJob.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            req.body,
            { new: true } // Return updated document
        );
        if (!repeatJob) return res.status(404).json({ success: false, message: "Job not found" });
        res.status(200).json({ success: true, data: repeatJob });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Delete a repeatable job
exports.deleteRepeatJob = async (req, res) => {
    try {
        const repeatJob = await RepeatJob.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!repeatJob) return res.status(404).json({ success: false, message: "Job not found" });
        res.status(200).json({ success: true, message: "Job deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
