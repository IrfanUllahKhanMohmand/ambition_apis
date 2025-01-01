const RideRequest = require("../models/RideRequest");
const Item = require("../models/Item");
const Driver = require("../models/Driver");
const User = require("../models/User");
const VehicleCategory = require("../models/VehicleCategory");
const PolyLinePoints = require("../models/PolyLinePoints");
const {
  getDistance,
  getEstimatedFare,
  getEstimatedTime,
  getPolyline,
} = require("../common/utils");

// Create RideRequest
exports.createRideRequest = async (req, res, io) => {
  try {
    const {
      user,
      vehicleCategory,
      moveType,
      pickupLocationLat,
      pickupLocationLng,
      pickupLocationName,
      pickupLocationAddress,
      dropoffLocationLat,
      dropoffLocationLng,
      dropoffLocationName,
      dropoffLocationAddress,
      distance,
      fare,
      items,
      customItems,
      pickupFloor,
      dropoffFloor,
      requiredHelpers,
      peopleTaggingAlong,
      specialRequirements,
    } = req.body;
    const distanceText = await getDistance(
      pickupLocationLat,
      pickupLocationLng,
      dropoffLocationLat,
      dropoffLocationLng
    );
    const polylinePoints = await getPolyline(
      `${pickupLocationLat},${pickupLocationLng}`,
      `${dropoffLocationLat},${dropoffLocationLng}`
    );

    const polyLinePoints = new PolyLinePoints({
      points: polylinePoints,
    });

    await polyLinePoints.save();

    const rideRequest = new RideRequest({
      user,
      vehicleCategory,
      moveType,
      pickupLocation: {
        type: "Point",
        coordinates: [pickupLocationLat, pickupLocationLng],
        name: pickupLocationName,
        address: pickupLocationAddress,
      },
      dropoffLocation: {
        type: "Point",
        coordinates: [dropoffLocationLat, dropoffLocationLng],
        name: dropoffLocationName,
        address: dropoffLocationAddress,
      },
      polylinePoints: polyLinePoints._id,
      distance,
      fare,
      items,
      customItems,
      requirements: {
        pickupFloor,
        dropoffFloor,
        requiredHelpers,
        peopleTaggingAlong,
        specialRequirements,
      },
    });

    await rideRequest.save();
    const drivers = await Driver.find({
      "car.category": vehicleCategory,
      status: "online",
    });
    if (drivers.length > 0) {
      drivers.forEach((driver) => {
        io.emit(driver._id, rideRequest);
      });
    }
    res.status(201).json(rideRequest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get RideRequest by ID
exports.getRideRequest = async (req, res) => {
  try {
    const rideRequest = await RideRequest.findById(req.params.id);
    if (!rideRequest)
      return res.status(404).json({ error: "RideRequest not found" });

    // Convert rideRequest to a plain object
    const rideRequestObj = rideRequest.toObject();

    const polyLinePoints = await PolyLinePoints.findById(
      rideRequestObj.polylinePoints
    );
    rideRequestObj.polylinePoints = polyLinePoints.points;

    // Update the items array with the desired structure
    rideRequestObj.items = await Promise.all(
      rideRequestObj.items.map(async (itm) => {
        const item = await Item.findById(itm.id);
        if (!item) {
          throw new Error(`Item with ID ${itm.id} not found`);
        }
        return {
          ...item.toObject(), // Include only item fields
          quantity: itm.quantity, // Add quantity from itm
        };
      })
    );

    // Send the updated rideRequest object
    res.json(rideRequestObj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Ride Request by ID with driver details and user details
exports.getRideRequestWithDriverAndUser = async (req, res) => {
  try {
    const rideRequest = await RideRequest.findById(req.params.id);
    if (!rideRequest)
      return res.status(404).json({ error: "RideRequest not found" });

    // Convert rideRequest to a plain object
    const rideRequestObj = rideRequest.toObject();

    const polyLinePoints = await PolyLinePoints.findById(
      rideRequestObj.polylinePoints
    );
    rideRequestObj.polylinePoints = polyLinePoints
      ? polyLinePoints.points
      : null;

    // Update the items array with the desired structure
    rideRequestObj.items = await Promise.all(
      rideRequestObj.items.map(async (itm) => {
        const item = await Item.findById(itm.id);
        if (!item) {
          throw new Error(`Item with ID ${itm.id} not found`);
        }
        return {
          ...item.toObject(), // Include only item fields
          quantity: itm.quantity, // Add quantity from itm
        };
      })
    );

    // Handle driver details
    let updatedDriver = null;
    if (rideRequestObj.driverId) {
      const driver = await Driver.findById(rideRequestObj.driverId);
      if (!driver) {
        throw new Error(`Driver with ID ${rideRequestObj.driverId} not found`);
      }
      const carCategory = await VehicleCategory.findById(driver.car.category);
      if (!carCategory) {
        throw new Error(
          `Car category with ID ${driver.car.category} not found`
        );
      }
      driver.car.category = carCategory.toObject();
      updatedDriver = {
        ...driver._doc,
        car: { ...driver._doc.car, category: carCategory },
      };
    }

    // Get user details
    const user = await User.findById(rideRequestObj.user);
    if (!user) {
      throw new Error(`User with ID ${rideRequestObj.user} not found`);
    }

    // Send the updated rideRequest object
    res.json({
      ...rideRequestObj,
      driver: updatedDriver, // Include driver or null
      user: user.toObject(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//Get the last RideRequest by User ID which has status of pending or ongoing
exports.getOnGoingRideRequestByUser = async (req, res) => {
  try {
    // Fetch the RideRequest
    const rideRequest = await RideRequest.findOne({
      user: req.params.id,
      status: { $in: ["pending", "ongoing"] },
    });

    if (!rideRequest) {
      return res.status(404).json({ error: "RideRequest not found" });
    }

    // Convert rideRequest to a plain object
    const rideRequestObj = rideRequest.toObject();

    const polyLinePoints = await PolyLinePoints.findById(
      rideRequestObj.polylinePoints
    );
    rideRequestObj.polylinePoints = polyLinePoints.points;

    // Update the items array with the desired structure
    rideRequestObj.items = await Promise.all(
      rideRequestObj.items.map(async (itm) => {
        const item = await Item.findById(itm.id);
        if (!item) {
          throw new Error(`Item with ID ${itm.id} not found`);
        }
        return {
          ...item.toObject(), // Include only item fields
          quantity: itm.quantity, // Add quantity from itm
        };
      })
    );

    // Send the updated rideRequest object
    res.json(rideRequestObj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get RideRequests by Driver ID by status of pending using car category of driver
exports.getPendingRideRequestsForDriverCarCategory = async (req, res) => {
  try {
    // Fetch the driver
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    // Fetch the RideRequest
    const rideRequest = await RideRequest.find({
      status: { $in: ["pending"] },
      vehicleCategory: driver.car.category,
    });

    if (!rideRequest) {
      return res.status(404).json({ error: "RideRequest not found" });
    }

    // Convert rideRequests to a plain object
    const rideRequestObj = rideRequest.map((ride) => ride.toObject());

    // Update the items array with the desired structure
    const processedRideRequests = await Promise.all(
      rideRequestObj.map(async (ride) => {
        const itemsWithDetails = await Promise.all(
          ride.items.map(async (itm) => {
            const item = await Item.findById(itm.id);
            return {
              ...item.toObject(), // Include only item fields
              quantity: itm.quantity, // Add quantity from itm
            };
          })
        );

        // Assign the detailed items back to the ride
        ride.items = itemsWithDetails;
        return ride;
      })
    );

    // Send the updated rideRequest object
    res.json(processedRideRequests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All RideRequests
exports.getAllRideRequests = async (req, res) => {
  try {
    // Fetch all ride requests as plain objects
    const rideRequests = await RideRequest.find().lean();

    const processedRideRequests = await Promise.all(
      rideRequests.map(async (ride) => {
        const itemsWithDetails = await Promise.all(
          ride.items.map(async (itm) => {
            const item = await Item.findById(itm.id);
            return {
              ...item.toObject(),
              quantity: itm.quantity,
            };
          })
        );

        // Assign the detailed items back to the ride
        ride.items = itemsWithDetails;
        return ride;
      })
    );

    res.json(processedRideRequests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Completed RideRequests
exports.getAllCompletedRideRequests = async (req, res) => {
  try {
    // Fetch all ride requests as plain objects
    const rideRequests = await RideRequest.find({ status: "completed" }).lean();

    const processedRideRequests = await Promise.all(
      rideRequests.map(async (ride) => {
        const itemsWithDetails = await Promise.all(
          ride.items.map(async (itm) => {
            const item = await Item.findById(itm.id);

            return {
              ...item.toObject(),
              quantity: itm.quantity,
            };
          })
        );

        // Assign the detailed items back to the ride
        ride.items = itemsWithDetails;
        return ride;
      })
    );

    res.json(processedRideRequests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Pending RideRequests
exports.getAllPendingRideRequests = async (req, res) => {
  try {
    const rideRequests = await RideRequest.find({ status: "pending" }).lean();

    if (!rideRequests.length) {
      return res.json([]);
    }

    console.log("Ride Requests:", rideRequests); // Log fetched documents

    const processedRideRequests = await Promise.all(
      rideRequests.map(async (ride) => {
        const itemsWithDetails = await Promise.all(
          ride.items.map(async (itm) => {
            const item = await Item.findById(itm.id);
            return {
              ...item.toObject(),
              quantity: itm.quantity,
            };
          })
        );

        // Assign the detailed items back to the ride
        ride.items = itemsWithDetails;
        return ride;
      })
    );

    res.json(processedRideRequests);
  } catch (error) {
    console.error("Error fetching ride requests:", error.message); // Log error
    res.status(500).json({ error: error.message });
  }
};

// Get All Ongoing RideRequests
exports.getAllOngoingRideRequests = async (req, res) => {
  try {
    // Fetch all ride requests as plain objects
    const rideRequests = await RideRequest.find({ status: "ongoing" }).lean();

    const processedRideRequests = await Promise.all(
      rideRequests.map(async (ride) => {
        const itemsWithDetails = await Promise.all(
          ride.items.map(async (itm) => {
            const item = await Item.findById(itm.id);

            return {
              ...item.toObject(),
              quantity: itm.quantity,
            };
          })
        );

        // Assign the detailed items back to the ride
        ride.items = itemsWithDetails;
        return ride;
      })
    );

    res.json(processedRideRequests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Canceled RideRequests
exports.getAllCanceledRideRequests = async (req, res) => {
  try {
    // Fetch all ride requests as plain objects
    const rideRequests = await RideRequest.find({ status: "canceled" }).lean();

    const processedRideRequests = await Promise.all(
      rideRequests.map(async (ride) => {
        const itemsWithDetails = await Promise.all(
          ride.items.map(async (itm) => {
            const item = await Item.findById(itm.id);

            return {
              ...item.toObject(),
              quantity: itm.quantity,
            };
          })
        );

        // Assign the detailed items back to the ride
        ride.items = itemsWithDetails;
        return ride;
      })
    );

    res.json(processedRideRequests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get number of total rides, total completed rides, total canceled rides, and total ongoing rides.
// Also get total revenue from completed rides.

exports.getRideStats = async (req, res) => {
  try {
    const totalRides = await RideRequest.countDocuments();
    const totalCompletedRides = await RideRequest.countDocuments({
      status: "completed",
    });
    const totalCanceledRides = await RideRequest.countDocuments({
      status: "canceled",
    });
    const totalOngoingRides = await RideRequest.countDocuments({
      status: "ongoing",
    });
    const completedRides = await RideRequest.find({
      status: "completed",
    });
    const totalRevenue = completedRides.reduce((acc, ride) => {
      return acc + ride.fare;
    }, 0);
    res.json({
      totalRides,
      totalCompletedRides,
      totalCanceledRides,
      totalOngoingRides,
      totalRevenue,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update RideRequest
exports.updateRideRequest = async (req, res) => {
  try {
    const {
      user,
      driver,
      moveType,
      pickupLocationLat,
      pickupLocationLng,
      pickupLocationName,
      pickupLocationAddress,
      dropoffLocationLat,
      dropoffLocationLng,
      dropoffLocationName,
      dropoffLocationAddress,
      distance,
      fare,
      items,
      customItems,
      pickupFloor,
      dropoffFloor,
      requiredHelpers,
      peopleTaggingAlong,
      specialRequirements,
    } = req.body;

    req.body = {};

    if (
      pickupLocationLat &&
      pickupLocationLng &&
      pickupLocationName &&
      pickupLocationAddress
    ) {
      req.body.pickupLocation = {
        type: "Point",
        coordinates: [pickupLocationLat, pickupLocationLng],
        name: pickupLocationName,
        address: pickupLocationAddress,
      };
    }

    if (
      dropoffLocationLat &&
      dropoffLocationLng &&
      dropoffLocationName &&
      dropoffLocationAddress
    ) {
      req.body.dropoffLocation = {
        type: "Point",
        coordinates: [dropoffLocationLat, dropoffLocationLng],
        name: dropoffLocationName,
        address: dropoffLocationAddress,
      };
    }

    if (distance) req.body.distance = distance;
    if (fare) req.body.fare = fare;
    if (items) req.body.items = items;
    if (customItems) req.body.customItems = customItems;

    if (
      pickupFloor ||
      dropoffFloor ||
      requiredHelpers ||
      peopleTaggingAlong ||
      specialRequirements
    ) {
      req.body.requirements = {}; // Create `requirements` object
      if (pickupFloor) req.body.requirements = { pickupFloor };
      if (dropoffFloor) req.body.requirements.dropoffFloor = dropoffFloor;
      if (requiredHelpers)
        req.body.requirements.requiredHelpers = requiredHelpers;
      if (peopleTaggingAlong)
        req.body.requirements.peopleTaggingAlong = peopleTaggingAlong;
      if (specialRequirements)
        req.body.requirements.specialRequirements = specialRequirements;
    }

    if (user) req.body.user = user;
    if (driver) req.body.driver = driver;
    if (moveType) req.body.moveType = moveType;

    const ride = await RideRequest.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!ride) return res.status(404).json({ error: "Ride not found" });
    res.json(ride);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete RideRequest
exports.deleteRideRequest = async (req, res) => {
  try {
    const rideRequest = await RideRequest.findByIdAndDelete(req.params.id);
    if (!rideRequest)
      return res.status(404).json({ error: "RideRequest not found" });
    res.json({ message: "RideRequest deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//Update driver id in ride request
exports.updateDriverId = async (req, res, io) => {
  try {
    const { driverId } = req.body;
    const rideRequest = await RideRequest.findByIdAndUpdate(
      req.params.id,
      { driverId, status: "ongoing" },
      { new: true }
    );
    if (!rideRequest)
      return res.status(404).json({ error: "RideRequest not found" });
    if (rideRequest.driverId) {
      io.emit("ride_request_accepted_" + rideRequest.driverId, rideRequest);
    }

    // Emit to user if user is not null
    if (rideRequest.user) {
      io.emit("ride_request_accepted_" + rideRequest.user, rideRequest);
    }
    res.json(rideRequest);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Fetch all ride requests by driver id with status of completed or canceled
exports.getClosedRideRequestsByDriver = async (req, res) => {
  try {
    const rideRequests = await RideRequest.find({
      driverId: req.params.id,
      status: { $in: ["completed", "canceled"] },
    });
    // Convert rideRequests to a plain object
    const rideRequestObj = rideRequests.map((ride) => ride.toObject());

    // Update the items array with the desired structure
    const processedRideRequests = await Promise.all(
      rideRequestObj.map(async (ride) => {
        const itemsWithDetails = await Promise.all(
          ride.items.map(async (itm) => {
            const item = await Item.findById(itm.id);
            return {
              ...item.toObject(), // Include only item fields
              quantity: itm.quantity, // Add quantity from itm
            };
          })
        );

        // Assign the detailed items back to the ride
        ride.items = itemsWithDetails;
        return ride;
      })
    );

    // Send the updated rideRequest object
    res.json(processedRideRequests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//Fetch all ride requests by user id with status of completed or canceled
exports.getClosedRideRequestsByUser = async (req, res) => {
  try {
    const rideRequests = await RideRequest.find({
      user: req.params.id,
      status: { $in: ["completed", "canceled"] },
    });

    // Convert rideRequests to a plain object
    const rideRequestObj = rideRequests.map((ride) => ride.toObject());

    // Update the items array with the desired structure
    const processedRideRequests = await Promise.all(
      rideRequestObj.map(async (ride) => {
        const itemsWithDetails = await Promise.all(
          ride.items.map(async (itm) => {
            const item = await Item.findById(itm.id);
            return {
              ...item.toObject(), // Include only item fields
              quantity: itm.quantity, // Add quantity from itm
            };
          })
        );

        // Assign the detailed items back to the ride
        ride.items = itemsWithDetails;
        return ride;
      })
    );

    // Send the updated rideRequest object
    res.json(processedRideRequests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//Fetch last ride request by driver id with status of ongoing
exports.getOnGoingRideRequestByDriver = async (req, res) => {
  try {
    const rideRequest = await RideRequest.findOne({
      driverId: req.params.id,
      status: "ongoing",
    });
    if (!rideRequest)
      return res.status(404).json({ error: "RideRequest not found" });
    // Convert rideRequest to a plain object
    const rideRequestObj = rideRequest.toObject();

    const polyLinePoints = await PolyLinePoints.findById(
      rideRequestObj.polylinePoints
    );
    rideRequestObj.polylinePoints = polyLinePoints.points;

    // Update the items array with the desired structure
    rideRequestObj.items = await Promise.all(
      rideRequestObj.items.map(async (itm) => {
        const item = await Item.findById(itm.id);
        if (!item) {
          throw new Error(`Item with ID ${itm.id} not found`);
        }
        return {
          ...item.toObject(), // Include only item fields
          quantity: itm.quantity, // Add quantity from itm
        };
      })
    );

    // Send the updated rideRequest object
    res.json(rideRequestObj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cancel RideRequest
exports.cancelRideRequest = async (req, res) => {
  try {
    const rideRequest = await RideRequest.findByIdAndUpdate(
      req.params.id,
      { status: "canceled" },
      { new: true }
    );
    if (!rideRequest)
      return res.status(404).json({ error: "RideRequest not found" });
    res.json(rideRequest);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Complete RideRequest
exports.completeRideRequest = async (req, res) => {
  try {
    const rideRequest = await RideRequest.findByIdAndUpdate(
      req.params.id,
      { status: "completed" },
      { new: true }
    );
    if (!rideRequest)
      return res.status(404).json({ error: "RideRequest not found" });
    res.json(rideRequest);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get estimated fare for a trip
exports.getEstimatedFare = async (req, res) => {
  try {
    const {
      originLat,
      originLong,
      destinationLat,
      destinationLong,
      vehicleCategoryId,
    } = req.body;
    const distance = await getDistance(
      originLat,
      originLong,
      destinationLat,
      destinationLong
    );
    const fare = await getEstimatedFare(distance, vehicleCategoryId);
    res.json({ distance, fare });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get estimated time for a trip
exports.getEstimatedTime = async (req, res) => {
  try {
    const { origin, destination } = req.body;
    const time = await getEstimatedTime(origin, destination);
    res.json({ time });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//Get distance between two locations
exports.getDistance = async (req, res) => {
  try {
    const { originLat, originLong, destinationLat, destinationLong } = req.body;
    const distance = await getDistance(
      originLat,
      originLong,
      destinationLat,
      destinationLong
    );
    res.send({ distance });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//Get Polyline between two locations
exports.getPolyline = async (req, res) => {
  try {
    const { origin, destination } = req.body;
    const polyline = await getPolyline(origin, destination);
    res.send({ polyline });
  } catch (error) {
    res.status(400).json({ error: error });
  }
};
