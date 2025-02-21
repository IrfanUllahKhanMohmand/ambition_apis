const VehicleCategory = require("../models/VehicleCategory");
const Item = require("../models/Item");
const {
  getDistance,
  getEstimatedTime,
  getEstimatedTimeFare,
  getRandomFare,
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
const categorizeCustomItem = (customItem, initialItems) => {
  for (let item of initialItems) {
    if (
      customItem.length <= item.length &&
      customItem.width <= item.width &&
      customItem.height <= item.height &&
      customItem.weight <= item.weight
    ) {
      return item.name; // Return the category name (e.g., "Extra Small")
    }
  }
  return null; // If no category matches
};
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

    const distance = await getDistance(
      originLat,
      originLong,
      destinationLat,
      destinationLong
    );

    const estimatedTime = await getEstimatedTime(
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
    customItems.forEach((customItem) => {
      const quantity = customItem.quantity || 1;
      totalVolume += customItem.height * customItem.width * customItem.length;
      totalWeight += customItem.weight;

      // Categorize the custom item
      const category = categorizeCustomItem(customItem, [
        { name: "Extra Small", length: 0.3, width: 0.3, height: 0.3, weight: 20 },
        { name: "Small", length: 0.5, width: 0.5, height: 0.5, weight: 25 },
        { name: "Medium", length: 1.2, width: 1.2, height: 1.2, weight: 35 },
        { name: "Medium +", length: 1.9, width: 1.9, height: 1.9, weight: 100 },
        { name: "Large", length: 2.5, width: 2.5, height: 2.5, weight: 150 },
        { name: "Extra Large", length: 2.6, width: 2.6, height: 2.6, weight: 151 },
      ]);

      if (category) {
        itemCounts[category] += quantity;
      }
    });


    // Fetch and filter vehicles
    const vehicleCategories = await VehicleCategory.find({
      loadVolume: { $gte: totalVolume },
      payloadCapacity: { $gte: totalWeight },
      passengerCapacity: { $gte: peopleTagging },
    });

    const filteredVehicles = vehicleCategories.filter((vehicle) => {
      const vanCategoryLimits = vehicle.capacity;
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
    } else {
      moveFilteredVehicles = filteredVehicles;
    }

    // Sort by prioritization criteria
    moveFilteredVehicles.sort((a, b) => {
      if (a.baseFare.min !== b.baseFare.min) return a.baseFare.min - b.baseFare.min;
      if (a.payloadCapacity !== b.payloadCapacity)
        return a.payloadCapacity - b.payloadCapacity;
      if (a.loadVolume !== b.loadVolume) return a.loadVolume - b.loadVolume;
      return a.passengerCapacity - b.passengerCapacity;
    });

    // Add fares and calculate item-based pricing
    const vehiclesWithFare = await Promise.all(
      moveFilteredVehicles.map(async (vehicle) => {
        try {
          const plainVehicle = vehicle.toObject();
          plainVehicle.estimatedFare = await getEstimatedTimeFare(
            originLat,
            originLong,
            destinationLat,
            destinationLong,
            vehicle._id
          );

          // Calculate item-based pricing
          const itemBasedPricing = Object.keys(itemCounts).reduce(
            (acc, itemType) => acc + (itemCounts[itemType] * (vehicle.pricing[itemType] || 0)),
            0
          );

          // Calculate event fare
          plainVehicle.itemBasedPricing = itemBasedPricing;
          plainVehicle.baseFare = getRandomFare(plainVehicle.baseFare.min, plainVehicle.baseFare.max);
          plainVehicle.initialServiceFee = getRandomFare(plainVehicle.initialServiceFee.min, plainVehicle.initialServiceFee.max);
          plainVehicle.timeFare = getRandomFare(plainVehicle.timeFare.min, plainVehicle.timeFare.max);

          plainVehicle.eventFare =
            plainVehicle.baseFare +
            plainVehicle.initialServiceFee +
            plainVehicle.estimatedFare +
            itemBasedPricing;

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
        time: parseFloat(estimatedTime)
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
          plainCar.estimatedFare = await getEstimatedTimeFare(
            originLat,
            originLong,
            destinationLat,
            destinationLong,
            car._id
          );
          plainCar.baseFare = getRandomFare(plainCar.baseFare.min, plainCar.baseFare.max);
          plainCar.initialServiceFee = getRandomFare(plainCar.initialServiceFee.min, plainCar.initialServiceFee.max);
          plainCar.timeFare = getRandomFare(plainCar.timeFare.min, plainCar.timeFare.max);

          plainCar.eventFare =
            plainCar.baseFare +
            plainCar.initialServiceFee + plainCar.estimatedFare;
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


