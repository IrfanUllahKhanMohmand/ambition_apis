const VehicleCategory = require("../models/VehicleCategory");
const Item = require("../models/Item");
const {
  getDistance,
  getEstimatedFare,
  getEstimatedTime,
} = require("../common/utils");

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
    const {
      items = [],
      customItems = [],
      peopleTagging = 0,
      originLat,
      originLong,
      destinationLat,
      destinationLong,
    } = req.body;

    if (!originLat || !originLong || !destinationLat || !destinationLong) {
      return res
        .status(400)
        .json({ error: "Missing required location coordinates." });
    }

    let totalVolume = 0;
    let totalWeight = 0;
    const itemCounts = {
      "Extra Small": 0,
      Small: 0,
      Medium: 0,
      "Medium +": 0,
      Large: 0,
      "Extra Large": 0,
    };

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

    const distance = await getDistance(
      originLat,
      originLong,
      destinationLat,
      destinationLong
    );

    // Process regular items
    if (items.length > 0) {
      const fetchedItems = await Promise.all(
        items.map((itm) => Item.findById(itm.id))
      );

      fetchedItems.forEach((item, index) => {
        if (item) {
          const quantity = items[index].quantity || 1;
          totalVolume += item.height * item.width * item.length * quantity;
          totalWeight += item.weight * quantity;
          itemCounts[item.itemType] += quantity;
        }
      });
    }

    // Process custom items
    customItems.forEach((itm) => {
      totalVolume += itm.height * itm.width * itm.length;
      totalWeight += itm.weight;
    });

    // Fetch all suitable vehicle categories
    const vehicleCategories = await VehicleCategory.find({
      loadVolume: { $gte: totalVolume },
      payloadCapacity: { $gte: totalWeight },
      passengerCapacity: { $gte: peopleTagging },
    });

    // Filter vehicles based on van category limits
    const filteredVehicles = vehicleCategories.filter((vehicle) => {
      const vanCategoryLimits = vanCategories[vehicle.name];
      if (vanCategoryLimits) {
        return Object.keys(itemCounts).every(
          (itemType) =>
            itemCounts[itemType] <= (vanCategoryLimits[itemType] || 0)
        );
      }
      return false;
    });

    // Calculate estimated fare for filtered vehicles using Promise.all
    const vehiclesWithFare = await Promise.all(
      filteredVehicles.map(async (vehicle) => {
        try {
          const plainVehicle = vehicle.toObject(); // Convert to plain object if Mongoose doc
          plainVehicle.estimatedFare = await getEstimatedFare(
            distance,
            vehicle._id
          );
          return plainVehicle;
        } catch (error) {
          console.error(
            `Error fetching fare for vehicle ${vehicle._id}:`,
            error
          );
          return { ...vehicle.toObject(), estimatedFare: null }; // Ensure the field exists
        }
      })
    );

    res.json({
      requestDetails: {
        totalVolume: totalVolume,
        totalWeight: totalWeight,
        itemCounts,
        peopleTagging,
        distance: parseFloat(distance.split(" ")[0]),
      },
      suggestedVehicle: vehiclesWithFare[0] || null,
      alternativeVehicles: vehiclesWithFare.slice(1),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
