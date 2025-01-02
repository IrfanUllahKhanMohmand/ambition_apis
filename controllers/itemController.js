const Item = require("../models/Item");

// Define the extreme end values based on item type in meters and kg
const itemDimensions = {
  "Extra Small": { height: 0.3, width: 0.3, length: 0.3, weight: 20 },
  Small: { height: 0.5, width: 0.5, length: 0.5, weight: 25 },
  Medium: { height: 1.2, width: 1.2, length: 1.2, weight: 35 },
  "Medium +": { height: 1.9, width: 1.9, length: 1.9, weight: 100 },
  Large: { height: 2.5, width: 2.5, length: 2.5, weight: 150 },
  "Extra Large": {
    height: 2.6,
    width: 2.6,
    length: 2.6,
    weight: 151,
  },
};

// Create Item
exports.createItem = async (req, res) => {
  try {
    const { name, itemType } = req.body;

    // Check if itemType is valid and exists in our dimensions map
    if (!itemDimensions[itemType]) {
      return res.status(400).json({ error: "Invalid itemType" });
    }

    // Retrieve the extreme end dimensions for the given itemType
    const { height, width, length, weight } = itemDimensions[itemType];

    // Create the item with extreme values
    const item = new Item({
      name,
      itemType,
      height: height,
      width: width,
      length: length,
      weight: weight,
    });

    await item.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all Items
exports.getItems = async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Item by ID
exports.getItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Item
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params; // Get item ID from request parameters
    const { name, itemType } = req.body; // Extract name and itemType from request body

    // Find the item by ID
    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    // Validate itemType if it is provided in the request body
    if (itemType && !itemDimensions[itemType]) {
      return res.status(400).json({ error: "Invalid itemType" });
    }

    // Update name if provided
    if (name) {
      item.name = name;
    }

    // Update itemType and its corresponding dimensions if provided
    if (itemType) {
      const { height, width, length, weight } = itemDimensions[itemType];
      item.itemType = itemType;
      item.height = height;
      item.width = width;
      item.length = length;
      item.weight = weight;
    }

    // Save the updated item to the database
    await item.save();

    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Item
exports.deleteItem = async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
