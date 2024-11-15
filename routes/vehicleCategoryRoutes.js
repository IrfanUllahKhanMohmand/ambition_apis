const express = require("express");

const router = express.Router();

const {
  createVehicleCategory,
  getVehicleCategories,
  getVehicleCategory,
  updateVehicleCategory,
  deleteVehicleCategory,
  getVehicleCategoriesByItems,
} = require("../controllers/vehicleCategoryController");

// Create a Vehicle Category
router.post("/", createVehicleCategory);

// Get all Vehicle Categories
router.get("/", getVehicleCategories);

// Get a Vehicle Category by ID

router.get("/:id", getVehicleCategory);

// Update Vehicle Category

router.put("/:id", updateVehicleCategory);

// Delete Vehicle Category

router.delete("/:id", deleteVehicleCategory);

// Get vehicle category by items and custom items
router.post("/items", getVehicleCategoriesByItems);

module.exports = router;
