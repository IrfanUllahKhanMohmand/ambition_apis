const Driver = require("../models/Driver");
const VehicleCategory = require("../models/VehicleCategory");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");

// Register a Driver
exports.createDriver = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      latitude,
      longitude,
      carMake,
      carModel,
      carYear,
      carPlate,
      carColor,
      vehicleCategory,
    } = req.body;
    if (!req.fileUrls) {
      return res.status(400).json({ error: "Please upload all files" });
    }

    let driver = await Driver.findOne({ email });
    if (driver) {
      return res.status(400).json({ error: "Driver already exists" });
    }

    driver = new Driver({
      name,
      email,
      password,
      phone,
      car: {
        make: carMake,
        model: carModel,
        year: carYear,
        plate: carPlate,
        color: carColor,
        category: vehicleCategory,
      },
      location: { type: "Point", coordinates: [latitude, longitude] },
      profile: req.fileUrls.profile,
      nationalIdFront: req.fileUrls.nationalIdFront,
      nationalIdBack: req.fileUrls.nationalIdBack,
      driverLicenseFront: req.fileUrls.driverLicenseFront,
      driverLicenseBack: req.fileUrls.driverLicenseBack,
    });
    driver.password = await bcrypt.hash(password, 10);
    await driver.save();

    const payload = { driverId: driver._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(201).json({
      message: "Driver registered successfully",
      token,
      driver: {
        id: driver._id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        car: driver.car,
        location: driver.location,
        profile: driver.profile,
        nationalIdFront: driver.nationalIdFront,
        nationalIdBack: driver.nationalIdBack,
        driverLicenseFront: driver.driverLicenseFront,
        driverLicenseBack: driver.driverLicenseBack,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Check if email exists middleware
exports.checkEmail = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ email: req.body.email });
    if (driver) {
      return res.status(400).json({ error: "Driver already exists" });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all Drivers

exports.getDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find();
    // Check if there are no drivers
    if (drivers.length === 0) {
      return res.status(404).json({ error: "No drivers found" });
    }
    //Fetch all car categories with each driver Car
    const driversWithCarCategory = await Promise.all(
      drivers.map(async (driver) => {
        const vehicleCategory = await VehicleCategory.findById(
          driver.car.category
        );
        return {
          ...driver._doc,
          car: { ...driver._doc.car, category: vehicleCategory },
        };
      })
    );

    res.json(driversWithCarCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Driver by ID
exports.getDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ error: "Driver not found" });

    // Fetch the car category for the current driver
    const carCategory = await VehicleCategory.findById(driver.car.category);

    res.json({
      ...driver._doc,
      car: { ...driver._doc.car, category: carCategory },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// login Driver
exports.loginDriver = async (req, res) => {
  try {
    const { email, password } = req.body;

    const driver = await Driver.findOne({ email });
    if (!driver) return res.status(400).json({ error: "Driver not found" });

    const isMatch = await bcrypt.compare(password, driver.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const payload = { driverId: driver._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({
      token,
      driver: {
        id: driver._id,
        email: driver.email,
        password: password,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Update Driver
exports.updateDriver = async (req, res) => {
  try {
    const {
      profile,
      nationalIdFront,
      nationalIdBack,
      driverLicenseFront,
      driverLicenseBack,
    } = req.fileUrls || {};

    // Update req.body with the files if they exist
    if (profile) req.body.profile = profile;
    if (nationalIdFront) req.body.nationalIdFront = nationalIdFront;
    if (nationalIdBack) req.body.nationalIdBack = nationalIdBack;
    if (driverLicenseFront) req.body.driverLicenseFront = driverLicenseFront;
    if (driverLicenseBack) req.body.driverLicenseBack = driverLicenseBack;

    // Attempt to update the driver document
    const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    // Check if driver exists; if not, send 404 response and exit
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    // Successfully updated, send 200 response
    res.status(200).json({ message: "Driver updated successfully", driver });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(400).json({ error: error.message });
  }
};

// Delete Driver
exports.deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndDelete(req.params.id);
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    res.json({ message: "Driver deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// update driver location
exports.updateDriverLocation = async (req, res, io) => {
  try {
    const { latitude, longitude } = req.body;
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      {
        location: { type: "Point", coordinates: [latitude, longitude] },
      },
      { new: true }
    );
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    const location = {
      ...driver.location,
      name: "Current Location",
      address: "Current Address",
    };
    io.emit("driver_location_update", JSON.stringify(location));
    res.json(location);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// update driver status
exports.updateDriverStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    res.json(driver);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// update driver car
exports.updateDriverCar = async (req, res) => {
  try {
    const { make, model, year, plate, color, category } = req.body;
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      {
        car: { make, model, year, plate, color, category },
      },
      { new: true }
    );
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    res.json(driver);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//get driver location
exports.getDriverLocation = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    //add name and address to the location object
    const location = {
      ...driver.location,
      name: "Current Location",
      address: "Current Address",
    };
    res.json(location);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//get driver status
exports.getDriverStatus = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    res.json({
      status: driver.status,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//get driver car
exports.getDriverCar = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    // Fetch the car category for the current driver
    const carCategory = await VehicleCategory.findById(driver.car.category);

    res.json({
      car: { ...driver.car, category: carCategory },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//Get the nearest driver
exports.getNearestDriver = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const drivers = await Driver.find({
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [latitude, longitude] },
          $maxDistance: 10000,
        },
      },
    });
    if (drivers.length === 0) {
      return res.status(404).json({ error: "No drivers found" });
    }
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
