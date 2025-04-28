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
const fcmRoutes = require('./routes/fcmRoutes');


const app = express();

app.use(cors({ origin: "*" }));
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
app.use('/api/fcm', fcmRoutes);

app.get("/api/sendSocketEvent", (req, res) => {
  io.emit("event", { message: "Hello from server!" });
  res.send("Event sent!");
});




const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
