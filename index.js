const express = require("express");
const connectDB = require("./config/db");
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");
const driverRoutes = require("./routes//driverRoutes");
const rideRoutes = require("./routes/rideRoutes");
const carCategoryRoutes = require("./routes/carCategoryRoutes");
const itemRoutes = require("./routes/itemRoutes");

const app = express();
app.use(express.json());

// Connect to MongoDB

connectDB();

// Routes
app.use("/api/users", userRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/car-categories", carCategoryRoutes);
app.use("/api/items", itemRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
