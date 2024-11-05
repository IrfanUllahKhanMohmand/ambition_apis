const CarCategory = require("../models/CarCategory");

// Create a Car Category
exports.createCarCategory = async (req, res) => {
  try {
    const carCategory = new CarCategory(req.body);
    await carCategory.save();
    res.status(201).json(carCategory);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all Car Categories
exports.getCarCategories = async (req, res) => {
  try {
    const carCategories = await CarCategory.find();
    res.json(carCategories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Car Category by ID

exports.getCarCategory = async (req, res) => {
  try {
    const carCategory = await CarCategory.findById(req.params.id);
    if (!carCategory)
      return res.status(404).json({ error: "Car Category not found" });
    res.json(carCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Car Category
exports.updateCarCategory = async (req, res) => {
  try {
    const carCategory = await CarCategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );
    if (!carCategory)
      return res.status(404).json({ error: "Car Category not found" });
    res.json(carCategory);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete Car Category

exports.deleteCarCategory = async (req, res) => {
  try {
    const carCategory = await CarCategory.findByIdAndDelete(req.params.id);
    if (!carCategory)
      return res.status(404).json({ error: "Car Category not found" });
    res.json({ message: "Car Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
