const RideRequest = require("../models/RideRequest");
const Item = require("../models/Item");

// Create RideRequest
exports.createRideRequest = async (req, res, io) => {
  try {
    const {
      user,
      driver,
      moveType,
      pickupLocationLat,
      pickupLocationLng,
      dropoffLocationLat,
      dropoffLocationLng,
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
    const rideRequest = new RideRequest({
      user,
      driver,
      moveType,
      pickupLocation: {
        type: "Point",
        coordinates: [pickupLocationLat, pickupLocationLng],
      },
      dropoffLocation: {
        type: "Point",
        coordinates: [dropoffLocationLat, dropoffLocationLng],
      },
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
    io.emit("rideRequest", rideRequest);
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
    res.json(rideRequest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All RideRequests
exports.getAllRideRequests = async (req, res) => {
  try {
    const rideRequests = await RideRequest.find();
    const rideRequestsWithItems = await Promise.all(
      rideRequests.map(async (ride) => {
        // Fetch all items for the current ride in parallel
        ride.items = await Promise.all(
          ride.items.map(async (itemId) => await Item.findById(itemId))
        );
        return ride;
      })
    );

    res.json(rideRequestsWithItems);
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
      dropoffLocationLat,
      dropoffLocationLng,
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

    if (pickupLocationLat && pickupLocationLng) {
      req.body.pickupLocation = {
        type: "Point",
        coordinates: [pickupLocationLat, pickupLocationLng],
      };
    }

    if (dropoffLocationLat && dropoffLocationLng) {
      req.body.dropoffLocation = {
        type: "Point",
        coordinates: [dropoffLocationLat, dropoffLocationLng],
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
exports.updateDriverId = async (req, res) => {
  try {
    const { driverId } = req.body;
    const rideRequest = await RideRequest.findByIdAndUpdate(
      req.params.id,
      { driver: driverId },
      { new: true }
    );
    if (!rideRequest)
      return res.status(404).json({ error: "RideRequest not found" });
    res.json(rideRequest);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
