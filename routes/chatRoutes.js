// File: routes/chatRoutes.js
const express = require("express");
const chatController = require("../controllers/chatController");

const router = express.Router();

module.exports = (io) => {
  // Fetch conversations: List of users with the last message
  router.get("/conversations/:userId", chatController.fetchConversations);

  // Fetch chat history with a specific user/driver/admin
  router.get("/:userId/:participantId", chatController.fetchChatWithUser);

  // Send a new message
  router.post("/message", (req, res) =>
    chatController.sendMessage(req, res, io)
  );

  return router;
};
