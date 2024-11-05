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
  updateDriver,
  deleteDriver,
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

      body("location", "Location is required").not().isEmpty(),
    ],
  ],
  (req, res, next) => {
    console.log(req.body);
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
router.get("/:id", auth, getDriver);
router.put("/:id", auth, updateDriver);
router.delete("/:id", auth, deleteDriver);

// Upload image to Firebase
router.post(
  "/upload-file",
  upload.single("file"),
  uploadToFirebase,
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      fileUrl: req.fileUrl, // Access the file URL from middleware
    });
  }
);

module.exports = router;
