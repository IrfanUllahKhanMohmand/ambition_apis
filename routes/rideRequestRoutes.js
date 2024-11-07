const express = require("express");
const router = express.Router();

const {
  createRideRequest,
  getRideRequest,
  getAllRideRequests,
  updateRideRequest,
  deleteRideRequest,
  updateDriverId,
} = require("../controllers/rideRequestController");
const auth = require("../middleware/auth");

module.exports = (io) => {
  router.post("/", auth, (req, res) => createRideRequest(req, res, io));
  router.get("/", auth, (req, res) => getAllRideRequests(req, res));
  router.get("/:id", auth, (req, res) => getRideRequest(req, res));
  router.put("/:id", auth, (req, res) => updateRideRequest(req, res));
  router.delete("/:id", auth, (req, res) => deleteRideRequest(req, res));
  router.put("/:id/driver", auth, (req, res) => updateDriverId(req, res));
  return router;
};
