const express = require("express");
const connectDB = require("./config/db");
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");
const driverRoutes = require("./routes//driverRoutes");
const rideRoutes = require("./routes/rideRoutes");

const app = express();
app.use(express.json());

// Connect to MongoDB

connectDB();

// Routes
app.use("/api/users", userRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/rides", rideRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
