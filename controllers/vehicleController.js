const Vehicle = require("../models/Vehicle");
const VehicleCategory = require("../models/VehicleCategory");

// Create a Vehicle
exports.createVehicle = async (req, res) => {
  try {
    const vehicle = new Vehicle(req.body);
    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all Vehicles
exports.getVehicles = async (req, res) => {
  try {
    // Find all vehicles and populate the 'vehicleCategory' field in a single query
    const vehicles = await Vehicle.find().populate("vehicleCategory");

    const refinedVehicles = vehicles.map((vehicle) => {
      // Refine the vehicle object to only include the necessary fields
      vehicle = vehicle.toObject();

      vehicle.vehicleCategory.initialServiceFee = vehicle.vehicleCategory.initialServiceFee.min;
      vehicle.vehicleCategory.baseFare = vehicle.vehicleCategory.baseFare.min;
      vehicle.vehicleCategory.timeFare = vehicle.vehicleCategory.timeFare.min;

      return vehicle;
    });




    res.json(refinedVehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//Admin Get all Vehicles
exports.getVehiclesAdmin = async (req, res) => {
  try {
    const vehicles = await Vehicle.find().populate("vehicleCategory");
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a Vehicle by ID
exports.getVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });
    res.json(vehicle);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update Vehicle
exports.updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });
    res.json(vehicle);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete Vehicle
exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });
    res.json(vehicle);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all Vehicles by Category
exports.getVehiclesByCategory = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ vehicleCategory: req.params.id });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
