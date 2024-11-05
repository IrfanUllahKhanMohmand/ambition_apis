const Driver = require("../models/Driver");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");

// Register a Driver
exports.createDriver = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    console.log(req.files);
    const profile = req.files?.profile[0]?.location;
    const nationalIdFront = req.files?.nationalIdFront[0]?.location;
    const nationalIdBack = req.files?.nationalIdBack[0]?.location;
    const driverLicenseFront = req.files?.driverLicenseFront[0]?.location;
    const driverLicenseBack = req.files?.driverLicenseBack[0]?.location;

    const { name, email, password, phone, car, location } = req.body;

    let driver = await Driver.findOne({ email });
    if (driver) {
      return res.status(400).json({ error: "Driver already exists" });
    }

    driver = new Driver({ name, email, password, phone, car, location });
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
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Driver by ID
exports.getDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    res.json(driver);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Driver
exports.updateDriver = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    res.json(driver);
  } catch (error) {
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
