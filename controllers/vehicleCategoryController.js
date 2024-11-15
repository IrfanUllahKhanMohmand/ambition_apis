const VehicleCategory = require("../models/VehicleCategory");
const Item = require("../models/Item");

// Create a Vehicle Category
exports.createVehicleCategory = async (req, res) => {
  try {
    const vehicleCategory = new VehicleCategory(req.body);
    await vehicleCategory.save();
    res.status(201).json(vehicleCategory);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all Vehicle Categories
exports.getVehicleCategories = async (req, res) => {
  try {
    const vehicleCategories = await VehicleCategory.find();
    res.json(vehicleCategories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a Vehicle Category by ID

exports.getVehicleCategory = async (req, res) => {
  try {
    const vehicleCategory = await VehicleCategory.findById(req.params.id);
    if (!vehicleCategory)
      return res.status(404).json({ error: "Vehicle Category not found" });
    res.json(vehicleCategory);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update Vehicle Category

exports.updateVehicleCategory = async (req, res) => {
  try {
    const vehicleCategory = await VehicleCategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!vehicleCategory)
      return res.status(404).json({ error: "Vehicle Category not found" });
    res.json(vehicleCategory);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete Vehicle Category

exports.deleteVehicleCategory = async (req, res) => {
  try {
    const vehicleCategory = await VehicleCategory.findByIdAndDelete(
      req.params.id
    );
    if (!vehicleCategory)
      return res.status(404).json({ error: "Vehicle Category not found" });
    res.json(vehicleCategory);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Fetch all vehicle categories based on list of items by calculating the total volume and weight and also passenger capacity
// /controllers/vehicleController.js

exports.getVehicleCategoriesByItems = async (req, res) => {
  try {
    const { items, customItems, peopleTagging } = req.body;
    let totalVolume = 0;
    let totalWeight = 0;

    const vanCategories = {
      "Ambition Lite": {
        "Extra Small": 15,
        Small: 10,
        Medium: 0,
        "Medium +": 0,
        Large: 0,
        "Extra Large": 0,
      },
      "Ambition Central": {
        "Extra Small": 40,
        Small: 30,
        Medium: 10,
        "Medium +": 5,
        Large: 5,
        "Extra Large": 0,
      },
      "Ambition Central-Hi": {
        "Extra Small": 45,
        Small: 40,
        Medium: 10,
        "Medium +": 5,
        Large: 5,
        "Extra Large": 0,
      },
      "Ambition Large": {
        "Extra Small": 50,
        Small: 40,
        Medium: 15,
        "Medium +": 10,
        Large: 10,
        "Extra Large": 5,
      },
      "Ambition Extra Large": {
        "Extra Small": 60,
        Small: 35,
        Medium: 15,
        "Medium +": 15,
        Large: 10,
        "Extra Large": 5,
      },
      "Ambition Crew": {
        "Extra Small": 40,
        Small: 30,
        Medium: 10,
        "Medium +": 5,
        Large: 5,
        "Extra Large": 5,
      },
      "Ambition Group": {
        "Extra Small": 55,
        Small: 40,
        Medium: 15,
        "Medium +": 10,
        Large: 5,
        "Extra Large": 5,
      },
      "Ambition Assist": {
        "Extra Small": 10,
        Small: 20,
        Medium: 5,
        "Medium +": 3,
        Large: 5,
        "Extra Large": 0,
      },
      "Ambition Small Luton": {
        "Extra Small": 70,
        Small: 65,
        Medium: 25,
        "Medium +": 15,
        Large: 15,
        "Extra Large": 5,
      },
      "Ambition Big Luton": {
        "Extra Small": 75,
        Small: 70,
        Medium: 30,
        "Medium +": 10,
        Large: 20,
        "Extra Large": 10,
      },
    };

    let itemCounts = {
      "Extra Small": 0,
      Small: 0,
      Medium: 0,
      "Medium +": 0,
      Large: 0,
      "Extra Large": 0,
    };

    // Calculate the total volume and weight of the items with quantity
    if (items && items.length > 0) {
      const fetchedItems = await Promise.all(
        items.map((itm) => Item.findById(itm.id))
      );

      fetchedItems.forEach((item, index) => {
        if (item) {
          const quantity = items[index].quantity || 1; // Default to 1 if quantity is not specified
          totalVolume += item.height * item.width * item.length * quantity;
          totalWeight += item.weight * quantity;
          itemCounts[item.itemType] += quantity;
        }
      });
    }

    // Calculate the total volume and weight of the custom items
    if (customItems && customItems.length > 0) {
      customItems.forEach((itm) => {
        totalVolume += itm.height * itm.width * itm.length;
        totalWeight += itm.weight;
      });
    }

    // Fetch all vehicle categories that can accommodate the items
    const vehicleCategories = await VehicleCategory.find({
      loadVolume: { $gte: totalVolume },
      payloadCapacity: { $gte: totalWeight },
      passengerCapacity: { $gte: peopleTagging ?? 0 },
    });

    // Filter vehicles based on the vanCategories limits
    const filteredVehicles = vehicleCategories.filter((vehicle) => {
      const vanCategoryLimits = vanCategories[vehicle.name];

      if (vanCategoryLimits) {
        // Check if the vehicle can accommodate all item counts within its category limits
        return Object.keys(itemCounts).every((itemType) => {
          return itemCounts[itemType] <= (vanCategoryLimits[itemType] || 0);
        });
      }

      return false; // Exclude vehicles not found in vanCategories
    });

    res.json({
      requestDetails: {
        totalVolume: `${totalVolume} m³`,
        totalWeight: `${totalWeight} kg`,
        itemCounts: itemCounts,
        peopleTagging: peopleTagging ?? 0,
      },
      //Suggest one vehicle as the suggested vehicle and other vehicles as alternative vehicles
      suggestedVehicle: filteredVehicles[0],
      alternativeVehicles: filteredVehicles.slice(1),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
