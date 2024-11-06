const Ride = require("../models/Ride");

// Create Ride
exports.createRide = async (req, res) => {
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
    const ride = new Ride({
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
    await ride.save();
    res.status(201).json(ride);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Ride by ID
exports.getRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ error: "Ride not found" });
    res.json(ride);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Rides
exports.getAllRides = async (req, res) => {
  try {
    const rides = await Ride.find();
    res.json(rides);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Ride
exports.updateRide = async (req, res) => {
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

    const ride = await Ride.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!ride) return res.status(404).json({ error: "Ride not found" });
    res.json(ride);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete Ride
exports.deleteRide = async (req, res) => {
  try {
    const ride = await Ride.findByIdAndDelete(req.params.id);
    if (!ride) return res.status(404).json({ error: "Ride not found" });
    res.json({ message: "Ride deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
