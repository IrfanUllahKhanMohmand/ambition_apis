const VehicleCategory = require("../models/VehicleCategory");
const Item = require("../models/Item");
const {
  getDistance,
  getEstimatedTime,
  getEstimatedTimeFare,
  getRandomFare,
  isRouteInCongestionZone
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

//isRouteInCongestionZone function
exports.isRouteInCongestionZone = async (req, res) => {
  try {
    const {
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

    const isCongestionZone = await isRouteInCongestionZone(
      `${originLat},${originLong}`,
      `${destinationLat},${destinationLong}`
    );
    res.json({ isCongestionZone });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
function isNightTime() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  // Convert time into minutes for easier comparison
  const currentTime = hours * 60 + minutes;
  const startNight = 21 * 60 + 30; // 9:30 PM in minutes
  const endNight = 6 * 60; // 6:00 AM in minutes

  // Check if current time is within the surcharge period
  return currentTime >= startNight || currentTime < endNight;
}

function calculateHelpersCharge(pickupFloor, dropoffFloor, requiredHelpers) {
  let floorCharge = 0;

  // Function to calculate floor charge
  function getFloorCharge(floor) {
    let charge = 0;
    if (floor !== 0) {
      for (let i = 1; i <= Math.abs(floor); i++) { // Start from 1 to the floor number
        charge += (Math.random() * (5.00 - 2.00) + 2.00);
      }
    }
    return charge;
  }

  // Calculate charges for pickup and dropoff floors
  floorCharge += getFloorCharge(pickupFloor);
  floorCharge += getFloorCharge(dropoffFloor);

  // Multiply floor charge by helpers since charge applies to each helper
  floorCharge *= requiredHelpers;

  // Base helper charge + floor charge
  return requiredHelpers * 10 + floorCharge;
}


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
      requiredHelpers,
      pickupFloor,
      dropoffFloor,
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


    const totalPeople = peopleTagging + (requiredHelpers || 0);


    // Fetch and filter vehicles
    const vehicleCategories = await VehicleCategory.find({
      loadVolume: { $gte: totalVolume },
      payloadCapacity: { $gte: totalWeight },
      passengerCapacity: { $gte: totalPeople },
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
      moveFilteredVehicles = filteredVehicles.filter(
        (vehicle) => vehicle.vehicleType !== "Refrigeration Van"
      );
    }

    // Sort by prioritization criteria
    moveFilteredVehicles.sort((a, b) => {
      if (a.serviceFee !== b.serviceFee) return a.serviceFee - b.serviceFee;
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

          // Calculate item-based pricing
          const itemBasedPricing = Object.keys(itemCounts).reduce(
            (acc, itemType) => {
              // Get the pricing object for the current itemType
              const pricing = vehicle.pricing[itemType];

              // If pricing exists, calculate the fare using the min or max value (they are the same)
              if (pricing) {
                const fare = getRandomFare(pricing.min, pricing.max);

                // Calculate the total price based on item count and fare
                acc += itemCounts[itemType] * fare;
              }

              return acc;
            },
            0
          );


          // Calculate event fare
          const timeFareRange = plainVehicle.timeFare.find(
            fare => estimatedTime >= fare.startMinutes && estimatedTime < fare.endMinutes
          );

          if (timeFareRange) {
            plainVehicle.timeFare = getRandomFare(timeFareRange.minPrice, timeFareRange.maxPrice);
          } else {
            return res.status(400).json({ error: "Invalid time range." });
          }
          //round it to 2 decimal places
          plainVehicle.itemBasedPricing = parseFloat((itemBasedPricing).toFixed(2));
          plainVehicle.helpersCharge = parseFloat(calculateHelpersCharge(pickupFloor, dropoffFloor, requiredHelpers).toFixed(2));
          //congestion charge is 15.00 if applicable
          const isCongestionZone = await isRouteInCongestionZone(
            `${originLat},${originLong}`,
            `${destinationLat},${destinationLong}`);
          plainVehicle.congestionCharge = isCongestionZone ? 15.00 : 0;
          if (isNightTime()) {
            plainVehicle.surcharge = parseFloat((Math.random() * (5.00 - 3.50) + 3.50).toFixed(2));
          } else {
            plainVehicle.surcharge = 0;
          }

          plainVehicle.eventFare =
            plainVehicle.initialServiceFee +
            plainVehicle.serviceFee +
            plainVehicle.timeFare +
            plainVehicle.helpersCharge +
            plainVehicle.congestionCharge +
            plainVehicle.surcharge +
            itemBasedPricing;

          plainVehicle.eventFare = parseFloat((plainVehicle.eventFare).toFixed(2));


          plainVehicle.fares = {
            initialServiceFee: plainVehicle.initialServiceFee,
            serviceFee: plainVehicle.serviceFee,
            timeFare: plainVehicle.timeFare,
            itemBasedPricing: plainVehicle.itemBasedPricing,
            helpersCharge: plainVehicle.helpersCharge,
            congestionCharge: plainVehicle.congestionCharge,
            surcharge: plainVehicle.surcharge,
            eventFare: plainVehicle.eventFare,
          };


          delete plainVehicle.pricing;
          delete plainVehicle.capacity;
          delete plainVehicle.initialServiceFee;
          delete plainVehicle.serviceFee;
          delete plainVehicle.timeFare;
          delete plainVehicle.itemBasedPricing;
          delete plainVehicle.helpersCharge;
          delete plainVehicle.congestionCharge;
          delete plainVehicle.surcharge;
          delete plainVehicle.eventFare;



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

    const estimatedTime = await getEstimatedTime(
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
          // Calculate event fare
          const timeFareRange = plainCar.timeFare.find(
            fare => estimatedTime >= fare.startMinutes && estimatedTime < fare.endMinutes
          );
          if (timeFareRange) {
            plainCar.timeFare = getRandomFare(timeFareRange.minPrice, timeFareRange.maxPrice);
          } else {
            return res.status(400).json({ error: "Invalid time range." });
          }

          plainCar.eventFare = plainCar.timeFare;

          plainCar.fares = {
            initialServiceFee: 0,
            serviceFee: 0,
            timeFare: plainCar.timeFare,
            itemBasedPricing: 0,
            helpersCharge: 0,
            congestionCharge: 0,
            surcharge: 0,
            eventFare: plainCar.eventFare,
          };

          delete plainCar.pricing;
          delete plainCar.capacity;
          delete plainCar.initialServiceFee;
          delete plainCar.serviceFee;
          delete plainCar.timeFare;
          delete plainCar.itemBasedPricing;
          delete plainCar.helpersCharge;
          delete plainCar.congestionCharge;
          delete plainCar.surcharge;
          delete plainCar.eventFare;



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


