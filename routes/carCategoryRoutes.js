const express = require("express");

const router = express.Router();

const {
  createCarCategory,
  getCarCategory,
  updateCarCategory,
  deleteCarCategory,
  getCarCategories,
} = require("../controllers/carCategoryController");

// Create a Car Category
router.post("/", createCarCategory);

// Get all Car Categories
router.get("/", getCarCategories);

// Get Car Category by ID

router.get("/:id", getCarCategory);

// Update Car Category

router.put("/:id", updateCarCategory);

// Delete Car Category

router.delete("/:id", deleteCarCategory);

module.exports = router;
