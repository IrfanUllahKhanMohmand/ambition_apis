const express = require("express");
const uploadToFirebase = require("../common/image_uploader");

const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });
const router = express.Router();

const {
  createAdmin,
  getAdmins,
  getAdmin,
  updateAdmin,
  loginAdmin,
  checkEmail,
} = require("../controllers/adminController");

const auth = require("../middleware/auth");

router.post(
  "/",
  upload.fields([{ name: "profile", maxCount: 1 }]),
  checkEmail,
  uploadToFirebase,
  createAdmin
);

router.post("/login", loginAdmin);

router.get("/", getAdmins);

router.get("/byId/:id", getAdmin);

router.put(
  "/:id",
  upload.fields([{ name: "profile", maxCount: 1 }]),
  uploadToFirebase,
  updateAdmin
);

module.exports = router;
