const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("dotenv").config();
const { createServer } = require("http");
const { Server } = require("socket.io");
const bodyParser = require("body-parser");

const userRoutes = require("./routes/userRoutes");
const driverRoutes = require("./routes//driverRoutes");
const vehicleCategoryRoutes = require("./routes/vehicleCategoryRoutes");
const itemRoutes = require("./routes/itemRoutes");
const rideRequestRoutes = require("./routes/rideRequestRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const chatRoutes = require("./routes/chatRoutes");
const repeatJobRoutes = require("./routes/repeatJobRoutes");
const stripeRoutes = require("./routes/stripeRoutes");

const adminRoutes = require("./routes/adminRoutes");
const instructionRoutes = require("./routes/instructionRoutes");


const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  bodyParser.json()(req, res, next);
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  /* options */
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.broadcast.emit("foo", "bar");

  // Disconnect event
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
  socket.on("message", (data) => {
    console.log("Message received from client:", data);
    socket.emit("response", {
      message: `Server received: ${JSON.stringify(data)}`,
    });
  });

  socket.on("event", (data) => {
    console.log("Event received from client:", data);
  });

  // Custom event listeners can be added here (e.g., order updates, ride status changes)
});

// Connect to MongoDB

connectDB();

// Routes
app.use("/api/users", userRoutes(io));
app.use("/api/drivers", driverRoutes(io));
app.use("/api/vehicle-categories", vehicleCategoryRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/ride-requests", rideRequestRoutes(io));
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/chat", chatRoutes(io));
app.use("/api/admins", adminRoutes);
app.use("/api/repeat-jobs", repeatJobRoutes);
app.use("/api/stripe", stripeRoutes);
app.use("/api/instructions", instructionRoutes);

app.get("/api/sendSocketEvent", (req, res) => {
  io.emit("event", { message: "Hello from server!" });
  res.send("Event sent!");
});

//Endpoint to delete a specific collection in mongoDB
// app.delete("/api/deleteCollection", async (req, res) => {
//   try {
//     const collection = req.body.collection;
//     await mongoose.connection.dropCollection(collection);
//     res.status(200).json({ message: "Collection deleted successfully" });
//   } catch (error) {
//     res.status(500).send(error);
//   }
// });




//Endpoint to update vehicle category pricing
// app.put("/api/updateVehicleCategoryPricing", async (req, res) => {
//   try {
//     for (const van of vanData) {
//       await VehicleCategory.updateOne(
//         { name: van.vanCategory }, // Match the vanCategory to vehicleType
//         {
//           $set: {
//             capacity: van.capacity,
//             pricing: van.pricing,
//             updatedAt: new Date(),
//           },
//         },
//         { upsert: true } // If the document doesn't exist, create a new one
//       );
//     }

//     return res.status(200).json({ message: "Vehicle categories updated successfully " });
//   } catch (err) {
//     return res.status(500).json({ message: err.message });
//   }
// }
// );

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
