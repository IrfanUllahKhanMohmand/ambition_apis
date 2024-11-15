const express = require("express");
const router = express.Router();

const {
  createVehicle,
  getVehicles,
  getVehicle,
  updateVehicle,
  deleteVehicle,
  getVehiclesByCategory,
} = require("../controllers/vehicleController");

// Create a Vehicle
router.post("/", createVehicle);

// Get all Vehicles
router.get("/", getVehicles);

// Get a Vehicle by ID
router.get("/:id", getVehicle);

// Update Vehicle
router.put("/:id", updateVehicle);

// Delete Vehicle
router.delete("/:id", deleteVehicle);

// Get all Vehicles by Category
router.get("/category/:category", getVehiclesByCategory);

module.exports = router;
