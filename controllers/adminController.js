const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
// Create Admin

exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!req.fileUrls?.profile) {
      return res.status(400).json({ error: "Please upload profile picture" });
    }

    const profile = req.fileUrls.profile;

    let admin = await Admin.findOne({ email });
    if (admin) {
      return res.status(400).json({ error: "Admin already exists" });
    }

    admin = new Admin({
      name,
      email,
      profile,
      password,
    });
    await admin.save();

    res.status(201).json({
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        profile: admin.profile,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all Admins

exports.getAdmins = async (req, res) => {
  try {
    const admins = await Admin.find();
    res.json(admins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Admin by ID

exports.getAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ error: "Admin not found" });
    res.json(admin);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update Admin

exports.updateAdmin = async (req, res) => {
  try {
    if (req.fileUrls?.profile) {
      req.body.profile = req.fileUrls.profile;
    }

    const admin = await Admin.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!admin) return res.status(404).json({ error: "Admin not found" });
    res.json(admin);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};



// Login Admin

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ error: "Admin not found" });

    const isMatch = admin.email === email && admin.password === password;
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const payload = { adminId: admin._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({
      token,
      admin: admin,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//check if email exists middleware
exports.checkEmail = async (req, res, next) => {
  try {
    const admin = await Admin.findOne({ email: req.body.email });

    if (admin) {
      return res.status(400).json({ error: "Admin already exists" });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
