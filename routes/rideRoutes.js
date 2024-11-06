const express = require("express");
const router = express.Router();
const {
  createRide,
  getRide,
  getAllRides,
  updateRide,
  deleteRide,
} = require("../controllers/rideController");
const auth = require("../middleware/auth");

// Create Ride with validation
router.post("/", auth, createRide);

// CRUD for Rides
router.get("/:id", auth, getRide);
router.get("/", auth, getAllRides);
router.put("/:id", auth, updateRide);
router.delete("/:id", auth, deleteRide);

module.exports = router;
