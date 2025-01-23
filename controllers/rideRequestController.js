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



const categorizeCustomItem = (customItem, initialItems) => {
  for (let item of initialItems) {
    if (
      customItem.length <= item.length &&
      customItem.width <= item.width &&
      customItem.height <= item.height &&
      customItem.weight <= item.weight
    ) {
      return item.name; // Return the category name (e.g., "Extra Small")
    }
  }
  return null; // If no category matches
};


// Create RideRequest
exports.createRideRequest = async (req, res, io) => {
  try {
    const {
      user,
      vehicleCategory,
      carCategory,
      moveType,
      jobType,
      isRideAndMove,
      isEventJob,
      pickupLocationLat,
      pickupLocationLng,
      pickupLocationName,
      pickupLocationAddress,
      dropoffLocationLat,
      dropoffLocationLng,
      dropoffLocationName,
      dropoffLocationAddress,
      distance,
      items,
      customItems,
      pickupFloor,
      dropoffFloor,
      requiredHelpers,
      peopleTaggingAlong,
      specialRequirements,
      passengersCount,
      transactionId,
    } = req.body;

    const polylinePoints = await getPolyline(
      `${pickupLocationLat},${pickupLocationLng}`,
      `${dropoffLocationLat},${dropoffLocationLng}`
    );

    const polyLinePoints = new PolyLinePoints({
      points: polylinePoints,
    });

    await polyLinePoints.save();

    let fare = {
      vehicleBaseFare: 0,
      vehicleDistanceFare: 0,
      vehicleItemBasedPricing: 0,
      carBaseFare: 0,
      carDistanceFare: 0,
      total: 0,
    };

    const itemCounts = {
      "Extra Small": 0,
      Small: 0,
      Medium: 0,
      "Medium +": 0,
      Large: 0,
      "Extra Large": 0,
    };

    customItems.forEach((customItem) => {
      const quantity = customItem.quantity || 1;
      // Categorize the custom item
      const category = categorizeCustomItem(customItem, [
        { name: "Extra Small", length: 0.3, width: 0.3, height: 0.3, weight: 20 },
        { name: "Small", length: 0.5, width: 0.5, height: 0.5, weight: 25 },
        { name: "Medium", length: 1.2, width: 1.2, height: 1.2, weight: 35 },
        { name: "Medium +", length: 1.9, width: 1.9, height: 1.9, weight: 100 },
        { name: "Large", length: 2.5, width: 2.5, height: 2.5, weight: 150 },
        { name: "Extra Large", length: 2.6, width: 2.6, height: 2.6, weight: 151 },
      ]);

      if (category) {
        itemCounts[category] += quantity;
      }
    });


    // Fetch vehicleCategory and carCategory details
    const vehicle = vehicleCategory
      ? await VehicleCategory.findById(vehicleCategory)
      : null;
    const car = carCategory
      ? await VehicleCategory.findById(carCategory)
      : null;

    // Calculate fare based on isEventJob
    if (vehicle) {
      fare.vehicleDistanceFare = (vehicle.distanceFare || 0) * distance;
      if (isEventJob) {
        fare.vehicleBaseFare = vehicle.baseFare || 0;
        fare.vehicleItemBasedPricing = Object.keys(itemCounts).reduce(
          (acc, itemType) => acc + (itemCounts[itemType] * (vehicle.pricing[itemType] || 0)),
          0
        );
      }
    }

    if (car) {
      fare.carDistanceFare = (car.distanceFare || 0) * distance;
      if (isEventJob) {
        fare.carBaseFare = car.baseFare || 0;
      }
    }

    fare.total =
      fare.vehicleBaseFare +
      fare.vehicleDistanceFare +
      fare.vehicleItemBasedPricing +
      fare.carBaseFare +
      fare.carDistanceFare;



    const rideRequest = new RideRequest({
      user,
      vehicleCategory,
      carCategory,
      moveType,
      jobType,
      isRideAndMove: isRideAndMove || false,
      isEventJob: isEventJob || false,
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
      passengersCount,
      transactionId,
    });

    await rideRequest.save();

    // Find drivers for both vehicleCategory and carCategory
    const vehicleDrivers = await Driver.find({
      "car.category": vehicleCategory,
      status: "online",
    });

    const carDrivers = carCategory
      ? await Driver.find({
        "car.category": carCategory,
        status: "online",
      })
      : [];

    // Emit the ride request to all relevant drivers
    const allDrivers = [...vehicleDrivers, ...carDrivers];
    const uniqueDrivers = new Set(
      allDrivers.map((driver) => driver._id.toString())
    );

    uniqueDrivers.forEach((driverId) => {
      io.emit(driverId, rideRequest);
    });

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
      status: {
        $in: ["pending", "accepted", "driver_accepted", "car_accepted"]
      },
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

    // Fetch the RideRequests that match either vehicleCategory or carCategory
    const rideRequests = await RideRequest.find({
      $or: [
        // For "pending" status: Fetch if either vehicleCategory or carCategory matches
        {
          status: "pending",
          $or: [
            { vehicleCategory: driver.car.category },
            { carCategory: driver.car.category },
          ],
        },

        // For "car_accepted" status: Fetch only if vehicleCategory matches
        {
          status: "car_accepted",
          vehicleCategory: driver.car.category,
        },

        // For "driver_accepted" status: Fetch only if carCategory matches
        {
          status: "driver_accepted",
          carCategory: driver.car.category,
        },
      ],
    });


    if (!rideRequests || rideRequests.length === 0) {
      return res.json([]);
    }

    // Convert rideRequests to plain objects
    const rideRequestObj = rideRequests.map((ride) => ride.toObject());

    // Process the items and calculate the fare for each rideRequest
    const processedRideRequests = await Promise.all(
      rideRequestObj.map(async (ride) => {
        // Fetch and process items with additional details
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

        // Determine the fare logic based on driver car category
        let totalFare = 0;

        // Convert ObjectIds to strings for comparison
        const vehicleCategoryId = ride.vehicleCategory.toString();
        const carCategoryId = ride.carCategory.toString();
        const driverCarCategoryId = driver.car.category.toString();

        if (vehicleCategoryId === driverCarCategoryId) {
          // Use vehicle fare calculation
          totalFare = ride.fare.vehicleBaseFare + ride.fare.vehicleDistanceFare + ride.fare.vehicleItemBasedPricing;
        } else if (carCategoryId === driverCarCategoryId) {
          // Use car fare calculation
          totalFare = ride.fare.carBaseFare + ride.fare.carDistanceFare;
        }

        // Add total fare to the ride's fare object
        ride.fare.total = totalFare;

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
    const rideRequests = await RideRequest.find({
      status: {
        $in: ["accepted", "driver_accepted", "car_accepted"]
      },
    }).lean();

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
      status: { $in: ["accepted", "driver_accepted", "car_accepted"] },
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

    // Fetch the driver
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    // Fetch the ride request
    const ride = await RideRequest.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ error: "RideRequest not found" });
    }

    // Convert ObjectIds to strings for comparison
    const vehicleCategoryId = ride.vehicleCategory.toString();
    const carCategoryId = ride.carCategory.toString();
    const driverCarCategoryId = driver.car.category.toString();

    // Helper function to update and emit ride details
    const updateAndEmitRide = async (updateFields, emitKeyPrefix) => {
      const updatedRide = await RideRequest.findByIdAndUpdate(req.params.id, updateFields, { new: true });

      if (!updatedRide) {
        return res.status(404).json({ error: "RideRequest not found" });
      }

      // Emit to driver if driverId exists
      if (updatedRide.driverId) {
        io.emit(`${emitKeyPrefix}_${updatedRide.driverId}`, updatedRide);
      }

      // Emit to user if user is not null
      if (updatedRide.user) {
        io.emit(`${emitKeyPrefix}_${updatedRide.user}`, updatedRide);
      }

      res.json(updatedRide);
    };

    // Determine the new status based on isRideMove and driver type
    let newStatus;
    let updateField;

    if (ride.isRideAndMove) {
      if (vehicleCategoryId === driverCarCategoryId) {
        // Check if driverId is already set
        if (ride.driverId && ride.driverId !== null) {
          return res.status(400).json({ error: "Ride already accepted by another driver" });
        }
        newStatus = ride.status === "car_accepted" ? "accepted" : "driver_accepted";
        updateField = { driverId, status: newStatus };
      } else if (carCategoryId === driverCarCategoryId) {
        // Check if carDriverId is already set
        if (ride.carDriverId && ride.carDriverId !== null) {
          return res.status(400).json({ error: "Ride already accepted by another driver" });
        }
        newStatus = ride.status === "driver_accepted" ? "accepted" : "car_accepted";
        updateField = { carDriverId: driverId, status: newStatus };
      } else {
        return res.status(400).json({ error: "Driver's category does not match any ride category" });
      }
    } else {
      if (vehicleCategoryId === driverCarCategoryId) {
        // Check if driverId is already set
        if (ride.driverId && ride.driverId !== null) {
          return res.status(400).json({ error: "Ride already accepted by another driver" });
        }
        newStatus = "accepted";
        updateField = { driverId, status: newStatus };
      } else if (carCategoryId === driverCarCategoryId) {
        // Check if carDriverId is already set
        if (ride.carDriverId && ride.carDriverId !== null) {
          return res.status(400).json({ error: "Ride already accepted by another driver" });
        }
        newStatus = "accepted";
        updateField = { carDriverId: driverId, status: newStatus };
      } else {
        return res.status(400).json({ error: "Driver's category does not match any ride category" });
      }
    }

    // Update and emit ride details
    await updateAndEmitRide(updateField, "ride_request_accepted");
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

    // Update the items array with the desired structure and calculate fare
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

        // Determine the fare logic based on driver car category
        const driver = await Driver.findById(req.params.id);
        if (!driver) {
          throw new Error("Driver not found");
        }

        let totalFare = 0;

        // Convert ObjectIds to strings for comparison
        const vehicleCategoryId = ride.vehicleCategory.toString();
        const carCategoryId = ride.carCategory.toString();
        const driverCarCategoryId = driver.car.category.toString();

        if (vehicleCategoryId === driverCarCategoryId) {
          // Use vehicle fare calculation
          totalFare = ride.fare.vehicleBaseFare + ride.fare.vehicleDistanceFare + ride.fare.vehicleItemBasedPricing;
        } else if (carCategoryId === driverCarCategoryId) {
          // Use car fare calculation
          totalFare = ride.fare.carBaseFare + ride.fare.carDistanceFare;
        }

        // Add total fare to the ride's fare object
        ride.fare.total = totalFare;

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
    // Determine the fare logic based on driver car category
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }
    const rideRequest = await RideRequest.findOne({
      $or: [
        // Match carDriverId with accepted or car_accepted statuses
        {
          carDriverId: req.params.id,
          status: { $in: ["accepted", "car_accepted"] },
        },
        // Match driverId with accepted or driver_accepted statuses
        {
          driverId: req.params.id,
          status: { $in: ["accepted", "driver_accepted"] },
        },
      ],
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



    let totalFare = 0;

    // Convert ObjectIds to strings for comparison
    const vehicleCategoryId = rideRequest.vehicleCategory.toString();
    const carCategoryId = rideRequest.carCategory.toString();
    const driverCarCategoryId = driver.car.category.toString();

    if (vehicleCategoryId === driverCarCategoryId) {
      // Use vehicle fare calculation
      totalFare =
        rideRequest.fare.vehicleBaseFare + rideRequest.fare.vehicleDistanceFare + rideRequest.fare.vehicleItemBasedPricing;
    } else if (carCategoryId === driverCarCategoryId) {
      // Use car fare calculation
      totalFare =
        rideRequest.fare.carBaseFare + rideRequest.fare.carDistanceFare;
    }

    // Add total fare to the ride's fare object
    rideRequestObj.fare.total = totalFare;

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
