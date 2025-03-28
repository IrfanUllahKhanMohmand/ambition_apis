const express = require("express");
const { body, validationResult } = require("express-validator");
const uploadToFirebase = require("../common/image_uploader");

const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

const router = express.Router();
const {
  createDriver,
  getDriver,
  getDrivers,
  updateDriver,
  deleteDriver,
  updateDriverLocation,
  updateDriverStatus,
  updateDriverCar,
  getDriverCar,
  getDriverLocation,
  getDriverStatus,
  checkEmail,
  loginDriver,
  resendOTP,
  verifyOTP,
  deleteDriverByPhone,
  getDriversAdmin,
  updateDriverPassword,
  sendOTPToDriverByEmail,
  resendOTPToDriverByEmail,
  verifyOTPForDriverByEmail
} = require("../controllers/driverController");
const auth = require("../middleware/auth");

module.exports = (io) => {
  // Driver registration with validation
  router.post(
    "/",

    upload.fields([
      { name: "profile", maxCount: 1 },
      { name: "driverLicenseFront", maxCount: 1 },
      { name: "driverLicenseBack", maxCount: 1 },
      { name: "licensePlatePicture", maxCount: 1 },
      { name: "vehicleFrontPicture", maxCount: 1 },
      { name: "vehicleBackPicture", maxCount: 1 },
      { name: "vehicleLeftPicture", maxCount: 1 },
      { name: "vehicleRightPicture", maxCount: 1 },
      { name: "vehicleInsurancePicture", maxCount: 1 },
      { name: "publicLiabilityInsurancePicture", maxCount: 1 },
      { name: "goodsInTransitInsurancePicture", maxCount: 1 },
      { name: "pcoLicensePicture", maxCount: 1 },
    ]),
    [
      [
        body("name", "Name is required").not().isEmpty(),
        body("email", "Please include a valid email").isEmail(),
        body(
          "password",
          "Please enter a password with 6 or more characters"
        ).isLength({
          min: 6,
        }),
        body("phone", "Phone number is required").not().isEmpty(),

        body("latitude", "Latitude is required").not().isEmpty(),
        body("longitude", "Longitude is required").not().isEmpty(),

      ],
    ],
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      next();
    },
    checkEmail,
    uploadToFirebase,
    createDriver
  );

  // update driver password
  router.post("/update-password", updateDriverPassword);

  // send OTP to driver by email  
  router.post("/send-otp", sendOTPToDriverByEmail);

  // resend OTP to driver by email

  router.post("/resend-otp-email", resendOTPToDriverByEmail);

  // verify OTP for driver by email

  router.post("/verify-otp-email", verifyOTPForDriverByEmail);

  // Driver login
  router.post("/login", loginDriver);

  // Protected routes for Driver CRUD
  router.get("/", getDrivers);

  // Admin Get all Drivers
  router.get("/admin", getDriversAdmin);

  router.get("/:id", getDriver);
  router.put(
    "/:id",

    upload.fields([
      { name: "profile", maxCount: 1 },
      { name: "driverLicenseFront", maxCount: 1 },
      { name: "driverLicenseBack", maxCount: 1 },
      { name: "licensePlatePicture", maxCount: 1 },
      { name: "vehicleFrontPicture", maxCount: 1 },
      { name: "vehicleBackPicture", maxCount: 1 },
      { name: "vehicleLeftPicture", maxCount: 1 },
      { name: "vehicleRightPicture", maxCount: 1 },
      { name: "vehicleInsurancePicture", maxCount: 1 },
      { name: "publicLiabilityInsurancePicture", maxCount: 1 },
      { name: "goodsInTransitInsurancePicture", maxCount: 1 },
      { name: "pcoLicensePicture", maxCount: 1 },
    ]),
    uploadToFirebase,
    updateDriver
  );
  router.delete("/:id", deleteDriver);

  // delete driver by phone
  router.delete("/phone/:phone", deleteDriverByPhone);


  // update driver location
  router.put("/location/:id", (req, res) => updateDriverLocation(req, res, io));

  // update driver status

  router.put("/status/:id", updateDriverStatus);

  // update driver car

  router.put("/car/:id", updateDriverCar);

  // get driver car

  router.get("/car/:id", getDriverCar);

  // get driver location

  router.get("/location/:id", getDriverLocation);

  // get driver status

  router.get("/status/:id", getDriverStatus);

  // resend OTP
  router.post("/resend-otp", resendOTP);

  // verify OTP
  router.post("/verify-otp", verifyOTP);
  return router;
};
