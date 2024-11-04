const express = require("express");
const { check } = require("express-validator");
const router = express.Router();
const {
  createRide,
  getRide,
  updateRide,
  deleteRide,
} = require("../controllers/rideController");
const auth = require("../middleware/auth");

// Create Ride with validation
router.post(
  "/",
  [
    check("pickupLocation", "Pickup location is required").notEmpty(),
    check("dropoffLocation", "Dropoff location is required").notEmpty(),
  ],
  auth,
  createRide
);

// CRUD for Rides
router.get("/:id", auth, getRide);
router.put("/:id", auth, updateRide);
router.delete("/:id", auth, deleteRide);

module.exports = router;
