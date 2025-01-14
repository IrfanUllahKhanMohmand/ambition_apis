const express = require("express");
const router = express.Router();
const {
  getItems,
  createItem,
  updateItem,
  deleteItem,
} = require("../controllers/itemController");

// Get all Items
router.get("/", getItems);

// Create Item
router.post("/", createItem);

// Update Item
router.put("/:id", updateItem);

// Delete Item
router.delete("/:id", deleteItem);

module.exports = router;
