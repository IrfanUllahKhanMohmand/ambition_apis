const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register User
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, phone, latitude, longitude } = req.body;

    if (!req.fileUrls?.profile) {
      return res.status(400).json({ error: "Please upload profile picture" });
    }

    const profile = req.fileUrls.profile;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: "User already exists" });
    }

    user = new User({
      name,
      email,
      password,
      phone,
      profile,
      location: { type: "Point", coordinates: [latitude, longitude] },
    });
    user.password = await bcrypt.hash(password, 10);
    await user.save();

    const payload = { userId: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profile: user.profile,
        phone: user.phone,
        location: user.location,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login User
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const payload = { userId: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profile: user.profile,
        phone: user.phone,
        location: user.location,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get User by ID
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Current User
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update User
exports.updateUser = async (req, res) => {
  try {
    if (req.fileUrls?.profile) {
      req.body.profile = req.fileUrls.profile;
    }
    if (req.body.latitude && req.body.longitude) {
      req.body.location = {
        type: "Point",
        coordinates: [req.body.latitude, req.body.longitude],
      };
    }
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete User
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
