const Car = require("../models/Car");

// Create a Car
exports.createCar = async (req, res) => {
  try {
    const car = new Car(req.body);
    await car.save();
    res.status(201).json(car);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all Cars

exports.getCars = async (req, res) => {
  try {
    const cars = await Car.find();
    res.json(cars);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Car by ID

exports.getCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ error: "Car not found" });
    res.json(car);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Car
exports.updateCar = async (req, res) => {
  try {
    const car = await Car.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!car) return res.status(404).json({ error: "Car not found" });
    res.json(car);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete Car

exports.deleteCar = async (req, res) => {
  try {
    const car = await Car.findByIdAndDelete(req.params.id);
    if (!car) return res.status(404).json({ error: "Car not found" });
    res.json({ message: "Car deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Car by Category
exports.getCarByCategory = async (req, res) => {
  try {
    const cars = await Car.find({ category: req.params.category });
    res.json(cars);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Car by Brand
exports.getCarByBrand = async (req, res) => {
  try {
    const cars = await Car.find({ make: req.params.make });
    res.json(cars);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Car by Model

exports.getCarByModel = async (req, res) => {
  try {
    const cars = await Car.find({ model: req.params.model });
    res.json(cars);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
