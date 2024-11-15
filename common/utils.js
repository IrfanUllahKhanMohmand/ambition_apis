const axios = require("axios");
const VehicleCategory = require("../models/VehicleCategory");

//Calculate the distance between origin and destination lat long using google maps api
const getDistance = (
  originLat,
  originLong,
  destinationLat,
  destinationLong
) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  return new Promise((resolve, reject) => {
    axios
      .get(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLong}&destinations=${destinationLat},${destinationLong}&key=${apiKey}`
      )
      .then((response) => {
        if (response.data.status === "OK") {
          resolve(response.data.rows[0].elements[0].distance.text);
        } else {
          reject(response.data.error_message);
        }
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
  });
};

//Get the estimated fare for a trip
const getEstimatedFare = async (distance, vehicleCategoryId) => {
  try {
    const vehicleCategory = await VehicleCategory.findById(vehicleCategoryId);
    const baseFare = vehicleCategory.baseFare;
    const distanceFare = vehicleCategory.distanceFare;
    const distanceInKm = parseFloat(distance.split(" ")[0]);
    const estimatedFare = baseFare + distanceFare * distanceInKm;
    return estimatedFare;
  } catch (error) {
    return error;
  }
};

//Get the estimated time for a trip using google maps api
const getEstimatedTime = (origin, destination) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  return new Promise((resolve, reject) => {
    axios
      .get(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&key=${apiKey}`
      )
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "OK") {
          resolve(data.rows[0].elements[0].duration.text);
        } else {
          reject(data.error_message);
        }
      })
      .catch((err) => reject(err));
  });
};

module.exports = {
  getDistance,
  getEstimatedFare,
  getEstimatedTime,
};
