const Driver = require("../models/Driver");
const RideRequest = require("../models/RideRequest");
const VehicleCategory = require("../models/VehicleCategory");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const twilio = require("twilio");
const DriverTempOtp = require("../models/DriverTempOtp");
require("dotenv").config();


// Twilio Client
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Generate OTP Function
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();


// Register a Driver
exports.createDriver = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      latitude,
      longitude,
      licenseCheckCode,
      carMake,
      carModel,
      carYear,
      carPlate,
      carColor,
      vehicleCategory,
      accountName,
      accountNumber,
      accountSortCode,
    } = req.body;
    if (!req.fileUrls) {
      return res.status(400).json({ error: "Please upload all files" });
    }

    let driverByEmail = await Driver.findOne({ email });
    if (driverByEmail) {
      return res.status(400).json({ error: "Driver already exists with the provided email" });
    }

    let driverByPhone = await Driver.findOne({ phone });
    if (driverByPhone) {
      return res.status(400).json({ error: "Driver already exists with the provided phone number" });
    }

    let newDriver = new Driver({
      name,
      email,
      phone,
      licenseCheckCode: licenseCheckCode ? licenseCheckCode : "",
      accountName: accountName,
      accountNumber: accountNumber,
      accountSortCode: accountSortCode,
      car: {
        make: carMake,
        model: carModel,
        year: carYear,
        plate: carPlate,
        color: carColor,
        category: vehicleCategory,
      },
      location: { type: "Point", coordinates: [latitude, longitude] },
      profile: req.fileUrls.profile,
      driverLicenseFront: req.fileUrls.driverLicenseFront,
      driverLicenseBack: req.fileUrls.driverLicenseBack,
      licensePlatePicture: req.fileUrls.licensePlatePicture,
      vehicleFrontPicture: req.fileUrls.vehicleFrontPicture,
      vehicleBackPicture: req.fileUrls.vehicleBackPicture,
      vehicleLeftPicture: req.fileUrls.vehicleLeftPicture,
      vehicleRightPicture: req.fileUrls.vehicleRightPicture,
      vehicleInsurancePicture: req.fileUrls.vehicleInsurancePicture,
      publicLiabilityInsurancePicture: req.fileUrls.publicLiabilityInsurancePicture,
      goodsInTransitInsurancePicture: req.fileUrls.goodsInTransitInsurancePicture,
      pcoLicensePicture: req.fileUrls.pcoLicensePicture,
    });
    await newDriver.save();

    const payload = { driverId: newDriver._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(201).json({
      message: "Driver registered successfully",
      token,
      driver: {
        id: newDriver._id,
        email: newDriver.email
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


//Create User Temp OTP
exports.createDriverTempOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    // Check if user already exists with the phone number
    const existingDriver = await Driver.findOne({ phone });
    if (existingDriver) {
      return res.status(400).json({ error: "An account with this phone number already exists. Please log in or use a different phone number." });
    }
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 4 * 60 * 1000); // 4 minutes

    let driverTempOtp = await DriverTempOtp.findOne({ phone });
    if (driverTempOtp) {
      driverTempOtp.otp = otp;
      driverTempOtp.otpExpires = otpExpires;
      await driverTempOtp.save();
    } else {
      driverTempOtp = new DriverTempOtp({
        phone,
        otp,
        otpExpires,
      });
      await driverTempOtp.save();
    }

    // Send OTP via Twilio
    await twilioClient.messages.create({
      body: `Your OTP code is ${otp}. It will expire in 4 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });

    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Verify User Temp OTP
exports.verifyDriverTempOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const driverTempOtp = await DriverTempOtp.findOne({ phone, otp, otpExpires: { $gt: new Date() } });
    if (!driverTempOtp) return res.status(400).json({ message: "Invalid OTP" });

    // Delete the OTP record after successful verification
    await DriverTempOtp.deleteOne({ _id: driverTempOtp._id });

    res.json({
      message: "OTP verified successfully",
      phone: driverTempOtp.phone,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Resend User Temp OTP
exports.resendDriverTempOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 4 * 60 * 1000); // 4 minutes

    let driverTempOtp = await DriverTempOtp.findOne({ phone });
    if (driverTempOtp) {
      driverTempOtp.otp = otp;
      driverTempOtp.otpExpires = otpExpires;
      await driverTempOtp.save();
    } else {
      driverTempOtp = new UserTempOtp({
        phone,
        otp,
        otpExpires,
      });
      await driverTempOtp.save();
    }

    // Send OTP via Twilio
    await twilioClient.messages.create({
      body: `Your OTP code is ${otp}. It will expire in 4 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });

    res.json({ message: "OTP resent successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};




// Send OTP to Driver's Associated Phone by Email
exports.sendOTPToDriverByEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const driver = await Driver.findOne({ email });
    if (!driver) return res.status(404).json({ error: "Driver not found" });

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 4 * 60 * 1000); // 4 minutes

    driver.otp = otp;
    driver.otpExpires = otpExpires;
    await driver.save();

    // Send OTP via Twilio
    await twilioClient.messages.create({
      body: `Your OTP code is ${otp}. It will expire in 4 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: driver.phone,
    });

    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Resend OTP to Driver's Associated Phone by Email
exports.resendOTPToDriverByEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const driver = await Driver.findOne({ email });
    if (!driver) return res.status(404).json({ error: "Driver not found" });

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 4 * 60 * 1000); // 4 minutes

    driver.otp = otp;
    driver.otpExpires = otpExpires;
    await driver.save();

    // Send OTP via Twilio
    await twilioClient.messages.create({
      body: `Your OTP code is ${otp}. It will expire in 4 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: driver.phone,
    });

    res.json({ message: "OTP resent successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Verify OTP for Driver by Email
exports.verifyOTPForDriverByEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const driver = await Driver.findOne({ email, otp, otpExpires: { $gt: new Date() } });
    if (!driver) return res.status(400).json({ message: "Invalid OTP" });

    res.json({
      message: "OTP verified successfully",
      driver: {
        id: driver._id,
        name: driver.name,
        email: driver.email,
        profile: driver.profile,
        phone: driver.phone,
        location: driver.location,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


//resend OTP
exports.resendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    const driver = await
      Driver
        .findOne({ phone });

    if (!driver) {
      return res.status(400).json({ message: "Driver not found" });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 4 * 60 * 1000); // 4 minutes

    await Driver
      .updateOne({ phone }, { otp, otpExpires }, { upsert: true });

    // Send OTP via Twilio
    await twilioClient.messages.create({
      body: `Your OTP code is ${otp}. It will expire in 4 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });

    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Verify OTP Function
exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const driver = await Driver
      .findOne({ phone, otp, otpExpires: { $gt: new Date() } });

    if (!driver) return res.status(400).json({ message: "Invalid OTP" });
    res.json({
      message: "OTP verified successfully",
      driver
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// Check if email exists middleware
exports.checkEmail = async (req, res, next) => {
  try {
    const driverByEmail = await Driver.findOne({ email: req.body.email });
    if (driverByEmail) {
      return res.status(400).json({ error: "Driver already exists with the provided email" });
    }

    const driverByPhone = await Driver.findOne({ phone: req.body.phone });
    if (driverByPhone) {
      return res.status(400).json({ error: "Driver already exists with the provided phone number" });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all Drivers

exports.getDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find();
    // Check if there are no drivers
    if (drivers.length === 0) {
      return res.status(404).json({ error: "No drivers found" });
    }
    //Fetch all car categories with each driver Car
    const driversWithCarCategory = await Promise.all(
      drivers.map(async (driver) => {
        const vehicleCategory = await VehicleCategory.findById(
          driver.car.category
        );

        return {
          ...driver._doc,
          car: { ...driver._doc.car, category: vehicleCategory },
        };
      })
    );

    res.json(driversWithCarCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


//Get all drivers admin 
exports.getDriversAdmin = async (req, res) => {
  try {
    const drivers = await Driver.find();
    // Check if there are no drivers
    if (drivers.length === 0) {
      return res.status(404).json({ error: "No drivers found" });
    }
    // Fetch all car categories with each driver Car and include ride request stats
    const driversWithDetails = await Promise.all(
      drivers.map(async (driver) => {
        const vehicleCategory = await VehicleCategory.findById(
          driver.car.category
        );

        const rideRequests = await RideRequest.find({
          $or: [
            { driverId: driver._id },
            { carDriverId: driver._id }
          ],
          status: { $in: ["completed", "canceled"] },
        });

        const completedRequests = rideRequests
          ? rideRequests.filter((request) => request.status === "completed").length
          : 0;

        const canceledRequests = rideRequests
          ? rideRequests.filter((request) => request.status === "canceled").length
          : 0;

        return {
          ...driver._doc,
          car: { ...driver._doc.car, category: vehicleCategory },
          stats: {
            completedRequests,
            canceledRequests,
          },
        };
      })
    );

    res.json(driversWithDetails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Driver by ID
exports.getDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ error: "Driver not found", type: "DRIVER_NOT_FOUND" });
    }
    if (driver.isDisabled) {
      return res.status(403).json({ error: "Driver is disabled", type: "DRIVER_DISABLED" });
    }

    // Fetch the car category for the current driver
    const carCategory = await VehicleCategory.findById(driver.car.category);

    // Fetch ride request stats
    const rideRequests = await RideRequest.find({
      $or: [
        { driverId: driver._id },
        { carDriverId: driver._id }
      ],
      status: { $in: ["completed", "canceled"] },
    });

    const completedRequests = rideRequests
      ? rideRequests.filter((request) => request.status === "completed").length
      : 0;

    const canceledRequests = rideRequests
      ? rideRequests.filter((request) => request.status === "canceled").length
      : 0;

    res.json({
      ...driver._doc,
      car: { ...driver._doc.car, category: carCategory },
      stats: {
        completedRequests,
        canceledRequests,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.sendDriverLoginOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    const driver = await Driver.findOne({ phone });
    if (!driver) {
      return res.status(404).json({ error: "Driver not found", type: "DRIVER_NOT_FOUND" });
    }
    if (driver.isDisabled) {
      return res.status(403).json({ error: "Driver is disabled", type: "DRIVER_DISABLED" });
    }

    let otp;
    if (phone === "+923099384039") {
      otp = "123456"; // Set OTP to 123456 for testing
    } else {
      otp = generateOTP();
      // Send OTP via Twilio for other numbers
      await twilioClient.messages.create({
        body: `Your OTP code is ${otp}. It will expire in 4 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });
    }

    const otpExpires = new Date(Date.now() + 4 * 60 * 1000); // 4 minutes

    driver.otp = otp;
    driver.otpExpires = otpExpires;
    await driver.save();

    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



exports.resendDriverLoginOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    const driver = await Driver.findOne({ phone });
    if (!driver) {
      return res.status(404).json({ error: "Driver not found", type: "DRIVER_NOT_FOUND" });
    }
    if (driver.isDisabled) {
      return res.status(403).json({ error: "Driver is disabled", type: "DRIVER_DISABLED" });
    }

    let otp;
    if (phone === "+923099384039") {
      otp = "123456"; // Set OTP to 123456 for testing
    } else {
      otp = generateOTP();
      // Send OTP via Twilio for other numbers
      await twilioClient.messages.create({
        body: `Your OTP code is ${otp}. It will expire in 4 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });
    }

    const otpExpires = new Date(Date.now() + 4 * 60 * 1000); // 4 minutes

    driver.otp = otp;
    driver.otpExpires = otpExpires;
    await driver.save();

    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};




// Verify OTP for Login
exports.verifyDriverLoginOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const driver = await Driver.findOne({ phone, otp, otpExpires: { $gt: new Date() } });
    if (!driver) return res.status(400).json({ error: "Invalid OTP" });

    // Clear OTP after successful verification
    driver.otp = null;
    driver.otpExpires = null;
    await driver.save();

    const payload = { driverId: driver._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      token,
      driver: {
        id: driver._id,
        email: driver.email
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Update Driver
exports.updateDriver = async (req, res) => {
  try {
    const {
      profile,
      driverLicenseFront,
      driverLicenseBack,
      licensePlatePicture,
      vehicleFrontPicture,
      vehicleBackPicture,
      vehicleLeftPicture,
      vehicleRightPicture,
      vehicleInsurancePicture,
      publicLiabilityInsurancePicture,
      goodsInTransitInsurancePicture,
      pcoLicensePicture,
    } = req.fileUrls || {};

    // Initialize an object to hold the updates
    const updateFields = {};

    // Add file URLs to updateFields if they exist
    if (profile) updateFields.profile = profile;
    if (driverLicenseFront)
      updateFields.driverLicenseFront = driverLicenseFront;
    if (driverLicenseBack) updateFields.driverLicenseBack = driverLicenseBack;
    if (licensePlatePicture)
      updateFields.licensePlatePicture = licensePlatePicture;
    if (vehicleFrontPicture)
      updateFields.vehicleFrontPicture = vehicleFrontPicture;
    if (vehicleBackPicture)
      updateFields.vehicleBackPicture = vehicleBackPicture;
    if (vehicleLeftPicture)
      updateFields.vehicleLeftPicture = vehicleLeftPicture;
    if (vehicleRightPicture)
      updateFields.vehicleRightPicture = vehicleRightPicture;
    if (vehicleInsurancePicture)
      updateFields.vehicleInsurancePicture = vehicleInsurancePicture;
    if (publicLiabilityInsurancePicture)
      updateFields.publicLiabilityInsurancePicture = publicLiabilityInsurancePicture;
    if (goodsInTransitInsurancePicture)
      updateFields.goodsInTransitInsurancePicture = goodsInTransitInsurancePicture;
    if (pcoLicensePicture) updateFields.pcoLicensePicture = pcoLicensePicture;


    // Add other fields to updateFields if they exist
    if (req.body.name) updateFields.name = req.body.name;
    if (req.body.licenseCheckCode) updateFields.licenseCheckCode = req.body.licenseCheckCode;
    if (req.body.accountSortCode) updateFields.accountSortCode = req.body.accountSortCode;
    if (req.body.accountName) updateFields.accountName = req.body.accountName;
    if (req.body.accountNumber) updateFields.accountNumber = req.body.accountNumber;



    // Check for vehicle category and add it to updateFields
    if (req.body.vehicleCategory) {
      const vehicleCategory = await VehicleCategory.findById(
        req.body.vehicleCategory
      );
      if (!vehicleCategory) {
        return res.status(404).json({ error: "Vehicle category not found" });
      }
      updateFields.vehicleCategory = vehicleCategory._id;
    }


    // Fetch the existing driver document
    const driver = await Driver.findById(req.params.id);

    // Check if driver exists; if not, send 404 response and exit
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    // Update car fields only if they are provided in the request
    const carUpdates = {};

    if (req.body.carMake) carUpdates.make = req.body.carMake;
    if (req.body.carModel) carUpdates.model = req.body.carModel;
    if (req.body.carYear) carUpdates.year = req.body.carYear;
    if (req.body.carPlate) carUpdates.plate = req.body.carPlate;
    if (req.body.carColor) carUpdates.color = req.body.carColor;
    if (req.body.vehicleCategory)
      carUpdates.category = updateFields.vehicleCategory;

    // If there are any updates to the car, merge them with existing car details
    if (Object.keys(carUpdates).length > 0) {
      updateFields.car = { ...driver.car.toObject(), ...carUpdates };
    }

    // Attempt to update the driver document with only the fields that exist
    const updatedDriver = await Driver.findByIdAndUpdate(
      req.params.id,
      updateFields,
      {
        new: true,
        runValidators: true, // Ensure validation is applied
      }
    );
    if (!updatedDriver)
      return res.status(404).json({ error: "Driver not found" });

    // Fetch the car category for the current driver
    const carCategory = await VehicleCategory.findById(
      updatedDriver.car.category
    );

    // Fetch ride request stats
    const rideRequests = await RideRequest.find({
      $or: [
        { driverId: updatedDriver._id },
        { carDriverId: updatedDriver._id }
      ],
      status: { $in: ["completed", "canceled"] },
    });

    const completedRequests = rideRequests
      ? rideRequests.filter((request) => request.status === "completed").length
      : 0;

    const canceledRequests = rideRequests
      ? rideRequests.filter((request) => request.status === "canceled").length
      : 0;

    res.json({
      ...updatedDriver._doc,
      car: { ...updatedDriver._doc.car, category: carCategory },
      stats: {
        completedRequests,
        canceledRequests,
      },
    });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(400).json({ error: error.message });
  }
};

// Delete Driver
exports.deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndDelete(req.params.id);
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    res.json({ message: "Driver deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Disable Driver
exports.disableDriver = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { isDisabled: true },
      { new: true }
    );
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    res.json({ message: "Driver disabled successfully", driver });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//Enable driver
exports.enableDriver = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { isDisabled: false },
      { new: true }
    );
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    res.json({ message: "Driver enabled successfully", driver });
  }
  catch (error) {
    res.status(500).json({ error: error.message });
  }

}

//Delete driver using phone number
exports.deleteDriverByPhone = async (req, res) => {
  try {
    const driver = await Driver.findOneAndDelete({ phone: req.params.phone });
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    res.json({ message: "Driver deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// update driver location
exports.updateDriverLocation = async (req, res, io) => {
  try {
    const { latitude, longitude } = req.body;
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      {
        location: { type: "Point", coordinates: [latitude, longitude] },
      },
      { new: true }
    );
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    const location = {
      ...driver.location,
      name: "Current Location",
      address: "Current Address",
    };
    const rideRequest = await RideRequest.findOne({
      $or: [
        { driverId: req.params.id },
        { carDriverId: req.params.id }
      ],
      status: {
        $in: ["accepted", "driver_accepted", "car_accepted"],
      }
    });


    if (rideRequest) {
      // Emit to driver if driverId is not null
      if (rideRequest.driverId && rideRequest.driverId.toString() === req.params.id) {
        io.emit(
          "driver_location_update_" + rideRequest.driverId,
          JSON.stringify(location)
        );
        if (rideRequest.user) {
          io.emit(
            "driver_location_update_" + rideRequest.user,
            JSON.stringify(location)
          );
        }

      }

      if (rideRequest.carDriverId && rideRequest.carDriverId.toString() === req.params.id) {
        io.emit(
          "car_driver_location_update_" + rideRequest.carDriverId,
          JSON.stringify(location)
        );
        if (rideRequest.user) {
          io.emit(
            "car_driver_location_update_" + rideRequest.user,
            JSON.stringify(location)
          );
        }
      }


    }
    res.json(location);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// update driver status
exports.updateDriverStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    res.json(driver);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// update driver car
exports.updateDriverCar = async (req, res) => {
  try {
    const { make, model, year, plate, color, category } = req.body;
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      {
        car: { make, model, year, plate, color, category },
      },
      { new: true }
    );
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    res.json(driver);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//get driver location
exports.getDriverLocation = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    //add name and address to the location object
    const location = {
      ...driver.location,
      name: "Current Location",
      address: "Current Address",
    };
    res.json(location);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//get driver status
exports.getDriverStatus = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    res.json({
      status: driver.status,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//get driver car
exports.getDriverCar = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    // Fetch the car category for the current driver
    const carCategory = await VehicleCategory.findById(driver.car.category);

    res.json({
      car: { ...driver.car, category: carCategory },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//Get the nearest driver
exports.getNearestDriver = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const drivers = await Driver.find({
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [latitude, longitude] },
          $maxDistance: 10000,
        },
      },
    });
    if (drivers.length === 0) {
      return res.status(404).json({ error: "No drivers found" });
    }
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
