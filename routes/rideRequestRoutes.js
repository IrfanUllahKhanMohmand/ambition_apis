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
  getOnGoingRideRequestByUser,
  getOnGoingRideRequestByDriver,
  getPendingRideRequestsForDriverCarCategory,
  getClosedRideRequestsByDriver,
  getClosedRideRequestsByUser,
  cancelRideRequest,
  completeRideRequest,
  getPolyline,
} = require("../controllers/rideRequestController");
const auth = require("../middleware/auth");

module.exports = (io) => {
  router.post("/", (req, res) => createRideRequest(req, res, io));
  router.get("/", (req, res) => getAllRideRequests(req, res));
  router.get("/:id", (req, res) => getRideRequest(req, res));
  //get on going ride request by user id
  router.get("/user/:id", (req, res) => getOnGoingRideRequestByUser(req, res));

  //get pending ride requests for driver by car category
  router.get("/driver/:id", (req, res) =>
    getPendingRideRequestsForDriverCarCategory(req, res)
  );

  //get on going ride request by driver id
  router.get("/driver/ongoing/:id", (req, res) =>
    getOnGoingRideRequestByDriver(req, res)
  );

  //get closed ride request by driver id
  router.get("/driver/closed/:id", (req, res) =>
    getClosedRideRequestsByDriver(req, res)
  );

  //get closed ride request by user id
  router.get("/user/closed/:id", (req, res) =>
    getClosedRideRequestsByUser(req, res)
  );

  //cancel ride request
  router.put("/cancel/:id", (req, res) => cancelRideRequest(req, res));

  //complete ride request
  router.put("/complete/:id", (req, res) => completeRideRequest(req, res));

  router.put("/:id", (req, res) => updateRideRequest(req, res));
  router.delete("/:id", (req, res) => deleteRideRequest(req, res));
  router.put("/:id/driver", (req, res) => updateDriverId(req, res, io));
  router.post("/distance", (req, res) => getDistance(req, res));
  router.post("/fare", (req, res) => getEstimatedFare(req, res));
  router.post("/time", (req, res) => getEstimatedTime(req, res));

  router.post("/polyline", (req, res) => getPolyline(req, res));
  return router;
};
