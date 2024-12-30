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
        $sort: { createdAt: -1, _id: -1 }, // Sort by createdAt and _id to resolve ties
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
          lastMessage: { $first: "$$ROOT" }, // Ensure consistency in grouped results
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id.participantId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $lookup: {
          from: "drivers",
          localField: "_id.participantId",
          foreignField: "_id",
          as: "driverDetails",
        },
      },
      {
        $unwind: {
          path: "$driverDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "vehiclecategories",
          localField: "driverDetails.car.category",
          foreignField: "_id",
          as: "carCategory",
        },
      },
      {
        $addFields: {
          "driverDetails.car.category": {
            $arrayElemAt: ["$carCategory", 0], // Assign the full VehicleCategory object
          },
        },
      },
      {
        $project: {
          carCategory: 0, // Remove the temporary carCategory field
        },
      },
      {
        $addFields: {
          participantDetails: {
            $cond: {
              if: { $eq: ["$_id.participantModel", "User"] },
              then: { $arrayElemAt: ["$userDetails", 0] },
              else: "$driverDetails",
            },
          },
        },
      },
      {
        $project: {
          participantId: "$_id.participantId",
          participantModel: "$_id.participantModel",
          lastMessage: 1,
          participantDetails: 1,
        },
      },
      {
        $sort: { "lastMessage.createdAt": -1, "lastMessage._id": -1 }, // Final sort after grouping
      },
    ]).allowDiskUse(true); // Allow disk use for large datasets

    res.status(200).json(conversations);
  } catch (error) {
    console.error(error);
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
exports.sendMessage = async (req, res, io) => {
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

    // Emit the new message to the receiver
    io.emit("chat_message", JSON.stringify(newMessage));
    console.log("Message sent:", newMessage);

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: "Failed to send message" });
  }
};
