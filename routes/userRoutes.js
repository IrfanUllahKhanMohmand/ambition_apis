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
  getUserLocation,
  updateUserLocation,
} = require("../controllers/userController");
const auth = require("../middleware/auth");

module.exports = (io) => {
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

  //Get user location
  router.get("/location/:id", getUserLocation);

  //Update user location
  router.put("/location/:id", (req, res) => updateUserLocation(req, res, io));

  router.get("/", getAllUsers);

  router.put(
    "/:id",
    auth,
    upload.fields([{ name: "profile", maxCount: 1 }]),
    uploadToFirebase,

    updateUser
  );
  router.delete("/:id", auth, deleteUser);

  return router;
};
