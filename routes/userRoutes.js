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
  resendOTP,
  verifyOTP,
  deleteUserByPhone,
  updatePassword,
  sendOTPByEmail,
  resendOTPByEmail,
  verifyOTPByEmail,
  disableUser,
  enableUser,
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

  router.post("/update-password", updatePassword);

  router.post("/send-otp", sendOTPByEmail);

  router.post("/resend-otp-email", resendOTPByEmail);

  router.post("/verify-otp-email", verifyOTPByEmail);


  router.post("/login", loginUser);

  router.get("/byId/:id", getUser);

  router.get("/me", getCurrentUser);

  //Get user location
  router.get("/location/:id", getUserLocation);

  //Update user location
  router.put("/location/:id", (req, res) => updateUserLocation(req, res, io));

  router.get("/", getAllUsers);

  router.put(
    "/:id",
    upload.fields([{ name: "profile", maxCount: 1 }]),
    uploadToFirebase,
    updateUser
  );
  router.delete("/:id", deleteUser);

  router.post("/disable/:id", disableUser);
  router.post("/enable/:id", enableUser);


  router.delete("/byPhone/:phone", deleteUserByPhone);

  router.post("/resend-otp", resendOTP);

  router.post("/verify-otp", verifyOTP);

  return router;
};
