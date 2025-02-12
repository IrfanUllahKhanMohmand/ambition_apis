const express = require("express");
const router = express.Router();
const instructionController = require("../controllers/instructionController");

router.post("/", instructionController.createInstruction);
router.get("/", instructionController.getAllInstructions);
router.get("/:id", instructionController.getInstructionById);
router.get("/user-type/:userType", instructionController.getInstructionsByUserType);
router.put("/:id", instructionController.updateInstruction);
router.delete("/:id", instructionController.deleteInstruction);

module.exports = router;
