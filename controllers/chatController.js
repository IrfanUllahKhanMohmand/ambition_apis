// File: controllers/chatController.js
const mongoose = require("mongoose");
const Message = require("../models/Message");
const User = require("../models/User");
const Driver = require("../models/Driver");

// Fetch Conversations: List of users chatted with, last message, ordered by last message
exports.fetchConversations = async (req, res) => {
  const { userId } = req.params;

  try {
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(userId) },
            { receiver: new mongoose.Types.ObjectId(userId) },
          ],
        },
      },
      {
        $sort: { createdAt: -1 }, // Sort by most recent message
      },
      {
        $group: {
          _id: {
            participantId: {
              $cond: {
                if: { $eq: ["$sender", new mongoose.Types.ObjectId(userId)] },
                then: "$receiver",
                else: "$sender",
              },
            },
            participantModel: {
              $cond: {
                if: { $eq: ["$sender", new mongoose.Types.ObjectId(userId)] },
                then: "$receiverModel",
                else: "$senderModel",
              },
            },
          },
          lastMessage: { $first: "$$ROOT" },
        },
      },
      {
        $lookup: {
          from: "users", // Look up user details if it's a User
          localField: "_id.participantId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $lookup: {
          from: "drivers", // Look up driver details if it's a Driver
          localField: "_id.participantId",
          foreignField: "_id",
          as: "driverDetails",
        },
      },
      {
        $project: {
          participantId: "$_id.participantId",
          participantModel: "$_id.participantModel",
          lastMessage: 1,
          userDetails: { $arrayElemAt: ["$userDetails", 0] },
          driverDetails: { $arrayElemAt: ["$driverDetails", 0] },
        },
      },
    ]);

    res.status(200).json(conversations);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
};

// Fetch Chat History with Specific User/Driver/Admin
exports.fetchChatWithUser = async (req, res) => {
  const { userId, participantId } = req.params;

  try {
    const chatHistory = await Message.find({
      $or: [
        {
          sender: new mongoose.Types.ObjectId(userId),
          receiver: new mongoose.Types.ObjectId(participantId),
        },
        {
          sender: new mongoose.Types.ObjectId(participantId),
          receiver: new mongoose.Types.ObjectId(userId),
        },
      ],
    }).sort({ createdAt: 1 }); // Sort by oldest first

    res.status(200).json(chatHistory);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
};

// Send Message
exports.sendMessage = async (req, res) => {
  const { sender, receiver, message } = req.body;

  try {
    // Determine the role of the sender
    let senderModel;
    if (await User.findById(sender)) {
      senderModel = "User";
    } else if (await Driver.findById(sender)) {
      senderModel = "Driver";
    } else {
      senderModel = "Admin"; // Assume Admin for unmatched IDs
    }

    // Determine the role of the receiver
    let receiverModel;
    if (await User.findById(receiver)) {
      receiverModel = "User";
    } else if (await Driver.findById(receiver)) {
      receiverModel = "Driver";
    } else {
      receiverModel = "Admin"; // Assume Admin for unmatched IDs
    }

    // Create and save the new message
    const newMessage = await Message.create({
      sender,
      senderModel,
      receiver,
      receiverModel,
      message,
    });

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: "Failed to send message" });
  }
};
