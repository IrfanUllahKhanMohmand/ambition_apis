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
  getRideRequestByUser,
  getRideRequestByDriver,
} = require("../controllers/rideRequestController");
const auth = require("../middleware/auth");

module.exports = (io) => {
  router.post("/", (req, res) => createRideRequest(req, res, io));
  router.get("/", (req, res) => getAllRideRequests(req, res));
  router.get("/:id", (req, res) => getRideRequest(req, res));
  //getRideRequest by user id
  router.get("/user/:id", (req, res) => getRideRequestByUser(req, res));

  //getRideRequest by driver id
  router.get("/driver/:id", (req, res) => getRideRequestByDriver(req, res));
  router.put("/:id", (req, res) => updateRideRequest(req, res));
  router.delete("/:id", (req, res) => deleteRideRequest(req, res));
  router.put("/:id/driver", (req, res) => updateDriverId(req, res));
  router.post("/distance", (req, res) => getDistance(req, res));
  router.post("/fare", (req, res) => getEstimatedFare(req, res));
  router.post("/time", (req, res) => getEstimatedTime(req, res));
  return router;
};
