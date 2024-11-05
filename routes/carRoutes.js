const express = require("express");

const { body, validationResult } = require("express-validator");

const router = express.Router();

const {
  createCar,
  getCar,
  getCars,
  updateCar,
  deleteCar,
  getCarByBrand,
  getCarByModel,
  getCarByCategory,
} = require("../controllers/carController");

// Car registration with validation
router.post(
  "/",
  [
    body("category", "Category is required").not().isEmpty(),
    body("make", "Make is required").not().isEmpty(),
    body("model", "Model is required").not().isEmpty(),
    body("year", "Year is required").not().isEmpty(),
    body("licensePlate", "LicensePlate is required").not().isEmpty(),
    body("capacity", "Capacity is required").not().isEmpty(),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  createCar
);

// Get all Cars
router.get("/", getCars);

// Get Car by ID

router.get("/:id", getCar);

// Update Car

router.put("/:id", updateCar);

// Delete Car

router.delete("/:id", deleteCar);

// Get Car by Category

router.get("/category/:category", getCarByCategory);

// Get Car by Brand

router.get("/brand/:make", getCarByBrand);

// Get Car by Model

router.get("/model/:model", getCarByModel);

module.exports = router;
