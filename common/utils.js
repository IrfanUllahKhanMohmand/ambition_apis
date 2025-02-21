const axios = require("axios");
const VehicleCategory = require("../models/VehicleCategory");




//get random fare between min and max
const getRandomFare = (min, max) => {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
};



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
        reject(err);
      });
  });
};



//Get the estimated time for a trip using google maps api
const getEstimatedTime = (originLat,
  originLong,
  destinationLat,
  destinationLong) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  return new Promise((resolve, reject) => {
    axios
      .get(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLong}&destinations=${destinationLat},${destinationLong}&key=${apiKey}`
      )
      .then((response) => {
        const data = response.data;
        if (data.status === "OK") {
          const value = data.rows[0].elements[0].duration.value;
          //convert seconds to minutes but with 2 decimal places and if the value is 0 or negative, return 0
          const duration = value <= 0 ? 0 : (value / 60).toFixed(2);
          resolve(duration);
        } else {
          reject(data.error_message);
        }
      })
      .catch((err) => reject(err));
  });
};

//Get the estimated time for a trip from the getEstimatedTime function
const getEstimatedTimeFare = async (originLat,
  originLong,
  destinationLat,
  destinationLong, vehicleCategoryId) => {
  try {
    const vehicleCategory = await VehicleCategory.findById(vehicleCategoryId);
    const timeFare = getRandomFare(vehicleCategory.timeFare.min, vehicleCategory.timeFare.max);
    const timeInMinutes = parseFloat(await getEstimatedTime(
      originLat,
      originLong,
      destinationLat,
      destinationLong
    ))


    //round upto 2 decimal places and return as float
    const estimatedFare = parseFloat((timeFare * timeInMinutes).toFixed(2));
    return estimatedFare;
  } catch (error) {
    return error;
  }
}

//function to get the polyline from the Google Directions API
const getPolyline = (origin, destination) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  return new Promise((resolve, reject) => {
    axios
      .get(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${apiKey}`
      )
      .then((res) => {
        // Check if the data is already parsed
        const data = res.data;
        if (data.status === "OK") {
          resolve(decodePolyline(data.routes[0].overview_polyline.points));
        } else {
          reject(data.error_message);
        }
      })
      .catch((err) => reject(err));
  });
};

const decodePolyline = (polyline) => {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates = [];
  while (index < polyline.length) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = polyline.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      b = polyline.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;
    coordinates.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return coordinates;
};

module.exports = {
  getRandomFare,
  getDistance,
  getEstimatedTimeFare,
  getEstimatedTime,
  getPolyline,
};
