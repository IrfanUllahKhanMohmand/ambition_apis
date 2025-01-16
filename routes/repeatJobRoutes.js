const express = require("express");
const router = express.Router();
const {
    createRepeatJob,
    getRepeatJobsByUserId,
    updateRepeatJob,
    deleteRepeatJob,
} = require("../controllers/RepeatJobController");


router.post("/", createRepeatJob); // Create a new repeatable job
router.get("/by-user/:userId", getRepeatJobsByUserId); // Get all repeatable jobs for the authenticated user
router.put("/:id", updateRepeatJob); // Update a repeatable job by ID
router.delete("/:id", deleteRepeatJob); // Delete a repeatable job by ID

module.exports = router;
