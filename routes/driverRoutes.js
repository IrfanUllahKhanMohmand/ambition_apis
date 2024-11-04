const express = require("express");
const { check } = require("express-validator");
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
  [
    check("name", "Name is required").notEmpty(),
    check("email", "Email is required").isEmail(),
    check("password", "Password must be at least 6 characters").isLength({
      min: 6,
    }),
  ],
  createDriver
);

// Protected routes for Driver CRUD
router.get("/:id", auth, getDriver);
router.put("/:id", auth, updateDriver);
router.delete("/:id", auth, deleteDriver);

module.exports = router;
