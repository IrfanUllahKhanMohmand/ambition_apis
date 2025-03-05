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
  getEstimatedTimeFare,
  getOnGoingRideRequestByUser,
  getOnGoingRideRequestByDriver,
  getPendingRideRequestsForDriverCarCategory,
  getClosedRideRequestsByDriver,
  getClosedRideRequestsByUser,
  cancelRideRequest,
  completeRideRequest,
  getPolyline,
  getAllCompletedRideRequests,
  getAllPendingRideRequests,
  getAllOngoingRideRequests,
  getAllCanceledRideRequests,
  getRideStats,
  getRideRequestWithDriverAndUser,
  getCompletedRideRequestsForPayment,
  updateDriverPaymentStatus,
  updateCarDriverPaymentStatus,
} = require("../controllers/rideRequestController");
const auth = require("../middleware/auth");

module.exports = (io) => {
  router.post("/", (req, res) => createRideRequest(req, res, io));
  router.get("/", (req, res) => getAllRideRequests(req, res));
  router.get("/byId/:id", (req, res) => getRideRequest(req, res));

  //get ride request by id with user and driver details
  router.get("/details/:id", (req, res) =>
    getRideRequestWithDriverAndUser(req, res)
  );

  //get on going ride request by user id
  router.get("/user/:id", (req, res) => getOnGoingRideRequestByUser(req, res));

  //get all completed ride requests
  router.get("/completed", (req, res) => getAllCompletedRideRequests(req, res));

  //get all pending ride requests
  router.get("/pending", (req, res) => getAllPendingRideRequests(req, res));

  //get all ongoing ride requests
  router.get("/ongoing", (req, res) => getAllOngoingRideRequests(req, res));

  //get all canceled ride requests
  router.get("/canceled", (req, res) => getAllCanceledRideRequests(req, res));

  //get ride stats
  router.get("/stats", (req, res) => getRideStats(req, res));
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

  //get completed ride requests for payment
  router.get("/payment", (req, res) =>
    getCompletedRideRequestsForPayment(req, res)
  );

  //cancel ride request
  router.put("/cancel/:id", (req, res) => cancelRideRequest(req, res));

  //complete ride request
  router.put("/complete/:id", (req, res) => completeRideRequest(req, res));

  //update driver payment status
  router.put("/driver/payment/:id", (req, res) =>
    updateDriverPaymentStatus(req, res)
  );

  //update car driver payment status
  router.put("/car/payment/:id", (req, res) =>
    updateCarDriverPaymentStatus(req, res)
  );

  router.put("/:id", (req, res) => updateRideRequest(req, res));
  router.delete("/:id", (req, res) => deleteRideRequest(req, res));
  router.put("/:id/driver", (req, res) => updateDriverId(req, res, io));
  router.post("/distance", (req, res) => getDistance(req, res));
  router.post("/fare", (req, res) => getEstimatedFare(req, res));
  router.post("/time", (req, res) => getEstimatedTime(req, res));
  router.post("/timefare", (req, res) => getEstimatedTimeFare(req, res));



  router.post("/polyline", (req, res) => getPolyline(req, res));
  return router;
};
