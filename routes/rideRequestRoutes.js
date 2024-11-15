const express = require("express");
const router = express.Router();

const {
  createRideRequest,
  getRideRequest,
  getAllRideRequests,
  updateRideRequest,
  deleteRideRequest,
  updateDriverId,
  getDistance,
  getEstimatedFare,
  getEstimatedTime,
} = require("../controllers/rideRequestController");
const auth = require("../middleware/auth");

module.exports = (io) => {
  router.post("/", auth, (req, res) => createRideRequest(req, res, io));
  router.get("/", auth, (req, res) => getAllRideRequests(req, res));
  router.get("/:id", auth, (req, res) => getRideRequest(req, res));
  router.put("/:id", auth, (req, res) => updateRideRequest(req, res));
  router.delete("/:id", auth, (req, res) => deleteRideRequest(req, res));
  router.put("/:id/driver", auth, (req, res) => updateDriverId(req, res));
  router.post("/distance", auth, (req, res) => getDistance(req, res));
  router.post("/fare", auth, (req, res) => getEstimatedFare(req, res));
  router.post("/time", auth, (req, res) => getEstimatedTime(req, res));
  return router;
};
