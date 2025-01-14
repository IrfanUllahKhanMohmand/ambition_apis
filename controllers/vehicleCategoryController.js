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
      moveType,
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
      "Ambition Environment Lite": {
        "Extra Small": 15,
        Small: 10,
        Medium: 0,
        "Medium +": 0,
        Large: 0,
        "Extra Large": 0,
      },
      "Ambition Environment Central": {
        "Extra Small": 40,
        Small: 30,
        Medium: 10,
        "Medium +": 5,
        Large: 5,
        "Extra Large": 0,
      },
      "Ambition Environment Large": {
        "Extra Small": 50,
        Small: 40,
        Medium: 15,
        "Medium +": 10,
        Large: 10,
        "Extra Large": 5,
      },
      Ambitious: {
        "Extra Small": 0,
        Small: 0,
        Medium: 0,
        "Medium +": 0,
        Large: 0,
        "Extra Large": 0,
      },
      "Ambitious XL": {
        "Extra Small": 0,
        Small: 0,
        Medium: 0,
        "Medium +": 0,
        Large: 0,
        "Extra Large": 0,
      },
      "Ambitious Luxury": {
        "Extra Small": 0,
        Small: 0,
        Medium: 0,
        "Medium +": 0,
        Large: 0,
        "Extra Large": 0,
      },
      "Ambitious Executive": {
        "Extra Small": 0,
        Small: 0,
        Medium: 0,
        "Medium +": 0,
        Large: 0,
        "Extra Large": 0,
      },
      "Ambitious Environment": {
        "Extra Small": 0,
        Small: 0,
        Medium: 0,
        "Medium +": 0,
        Large: 0,
        "Extra Large": 0,
      },
      "Ambitious Assist": {
        "Extra Small": 0,
        Small: 0,
        Medium: 0,
        "Medium +": 0,
        Large: 0,
        "Extra Large": 0,
      },
      "Ambitious Team": {
        "Extra Small": 0,
        Small: 0,
        Medium: 0,
        "Medium +": 0,
        Large: 0,
        "Extra Large": 0,
      },
      "Ambition Pet": {
        "Extra Small": 0,
        Small: 0,
        Medium: 0,
        "Medium +": 0,
        Large: 0,
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
      "Ambition Refrigeration Lite": {
        "Extra Small": 15,
        Small: 10,
        Medium: 0,
        "Medium +": 0,
        Large: 0,
        "Extra Large": 0,
      },
      "Ambition Refrigeration Central": {
        "Extra Small": 40,
        Small: 30,
        Medium: 10,
        "Medium +": 5,
        Large: 5,
        "Extra Large": 0,
      },
      "Ambition Refrigeration Large": {
        "Extra Small": 50,
        Small: 40,
        Medium: 15,
        "Medium +": 10,
        Large: 10,
        "Extra Large": 5,
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

    // Fetch and filter vehicles
    const vehicleCategories = await VehicleCategory.find({
      loadVolume: { $gte: totalVolume },
      payloadCapacity: { $gte: totalWeight },
      passengerCapacity: { $gte: peopleTagging },
    });

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

    let moveFilteredVehicles = [];
    if (moveType === "refrigeration") {
      moveFilteredVehicles = filteredVehicles.filter(
        (vehicle) => vehicle.vehicleType === "Refrigeration Van"
      );
    } else if (moveType === "luton van") {
      moveFilteredVehicles = filteredVehicles.filter(
        (vehicle) => vehicle.vehicleType === "Luton Van"
      );
    } else if (moveType === "ambition enviorment") {
      moveFilteredVehicles = filteredVehicles.filter(
        (vehicle) => vehicle.vehicleType === "Environment Van"
      );
    }
    else {
      moveFilteredVehicles = filteredVehicles;
    }

    // Sort by prioritization criteria
    moveFilteredVehicles.sort((a, b) => {
      if (a.baseFare !== b.baseFare) return a.baseFare - b.baseFare;
      if (a.payloadCapacity !== b.payloadCapacity)
        return a.payloadCapacity - b.payloadCapacity;
      if (a.loadVolume !== b.loadVolume) return a.loadVolume - b.loadVolume;
      return a.passengerCapacity - b.passengerCapacity;
    });

    // Add fares
    const vehiclesWithFare = await Promise.all(
      moveFilteredVehicles.map(async (vehicle) => {
        try {
          const plainVehicle = vehicle.toObject();
          plainVehicle.estimatedFare = await getEstimatedFare(
            distance,
            vehicle._id
          );
          plainVehicle.eventFare =
            plainVehicle.baseFare + plainVehicle.estimatedFare;
          return plainVehicle;
        } catch (error) {
          console.error(
            `Error fetching fare for vehicle ${vehicle._id}:`,
            error
          );
          return { ...vehicle.toObject(), estimatedFare: null };
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

exports.getCarCategoriesByPassengers = async (req, res) => {
  try {
    const {
      passengersCount = 0,
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

    if (!passengersCount || passengersCount <= 0) {
      return res
        .status(400)
        .json({ error: "Invalid passengersCount. It must be greater than 0." });
    }

    // Calculate distance
    const distance = await getDistance(
      originLat,
      originLong,
      destinationLat,
      destinationLong
    );

    // Fetch car category vehicles only
    const carCategories = await VehicleCategory.find({
      vehicleType: "Car",
      passengerCapacity: { $gte: passengersCount },
    });

    // Calculate estimated fare for car categories
    const carsWithFare = await Promise.all(
      carCategories.map(async (car) => {
        try {
          const plainCar = car.toObject(); // Convert to plain object if Mongoose doc
          // Fare for event contains car base fare + estimated fare
          plainCar.estimatedFare = await getEstimatedFare(distance, car._id);
          plainCar.eventFare = plainCar.baseFare + plainCar.estimatedFare;
          return plainCar;
        } catch (error) {
          console.error(`Error fetching fare for car ${car._id}:`, error);
          return { ...car.toObject(), estimatedFare: null }; // Ensure the field exists
        }
      })
    );

    res.json({
      suggestedVehicle: carsWithFare[0] || null,
      alternativeVehicles: carsWithFare.slice(1),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
