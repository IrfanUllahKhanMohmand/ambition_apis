const express = require("express");
const uploadToFirebase = require("../common/image_uploader");

const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });
const router = express.Router();
const {
  createUser,
  getUser,
  getCurrentUser,
  getAllUsers,
  updateUser,
  deleteUser,
  loginUser,
  checkEmail,
} = require("../controllers/userController");
const auth = require("../middleware/auth");

router.post(
  "/",
  upload.fields([{ name: "profile", maxCount: 1 }]),
  checkEmail,
  uploadToFirebase,
  createUser
);

router.post("/login", loginUser);

router.get("/byId/:id", auth, getUser);

router.get("/me", auth, getCurrentUser);

router.get("/", getAllUsers);

router.put(
  "/:id",
  auth,
  upload.fields([{ name: "profile", maxCount: 1 }]),
  uploadToFirebase,

  updateUser
);
router.delete("/:id", auth, deleteUser);

module.exports = router;
