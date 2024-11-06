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
} = require("../controllers/driverController");
const auth = require("../middleware/auth");

// Driver registration with validation
router.post(
  "/",

  upload.fields([
    { name: "profile", maxCount: 1 },
    { name: "nationalIdFront", maxCount: 1 },
    { name: "nationalIdBack", maxCount: 1 },
    { name: "driverLicenseFront", maxCount: 1 },
    { name: "driverLicenseBack", maxCount: 1 },
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
      body("car", "Car is required").not().isEmpty(),

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
  uploadToFirebase,
  createDriver
);

// Protected routes for Driver CRUD
router.get("/", getDrivers);
router.get("/:id", getDriver);
router.put(
  "/:id",

  upload.fields([
    { name: "profile", maxCount: 1 },
    { name: "nationalIdFront", maxCount: 1 },
    { name: "nationalIdBack", maxCount: 1 },
    { name: "driverLicenseFront", maxCount: 1 },
    { name: "driverLicenseBack", maxCount: 1 },
  ]),
  uploadToFirebase,
  updateDriver
);
router.delete("/:id", deleteDriver);

// update driver location
router.put("/location/:id", updateDriverLocation);

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

module.exports = router;
