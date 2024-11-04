const express = require("express");
const router = express.Router();
const {
  createUser,
  getUser,
  getCurrentUser,
  getAllUsers,
  updateUser,
  deleteUser,
  loginUser,
} = require("../controllers/userController");
const auth = require("../middleware/auth");

router.post("/", createUser);

router.post("/login", loginUser);

router.get("/byId/:id", auth, getUser);

router.get("/me", auth, getCurrentUser);

router.get("/", auth, getAllUsers);

router.put("/:id", auth, updateUser);
router.delete("/:id", auth, deleteUser);

module.exports = router;
