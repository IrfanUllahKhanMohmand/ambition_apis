const User = require("../models/User");
const RideRequest = require("../models/RideRequest");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const twilio = require("twilio");
require("dotenv").config();


// Twilio Client
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Generate OTP Function
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();





// Register User
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, phone, latitude, longitude } = req.body;

    // if (!req.fileUrls?.profile) {
    //   return res.status(400).json({ error: "Please upload profile picture" });
    // }

    const profile = req.fileUrls?.profile || "";

    // Check if user already exists with the email or phone number
    let user = await User.findOne({ $or: [{ email }, { phone }] });
    if (user) {
      return res.status(400).json({ error: "User already exists with this email or phone number" });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 4 * 60 * 1000); // 4 minutes

    // Send OTP via Twilio and handle errors
    try {
      await twilioClient.messages.create({
        body: `Your OTP code is ${otp}. It will expire in 4 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone
      });
    } catch (otpError) {
      return res.status(500).json({ error: otpError.message });
    }

    // Create and save user
    user = new User({
      name,
      email,
      password: await bcrypt.hash(password, 10), // Hash password before saving
      phone,
      otp,
      otpExpires,
      profile,
      location: { type: "Point", coordinates: [latitude, longitude] },
    });

    await user.save();

    // Generate JWT Token
    const payload = { userId: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "10h" });

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

//Update password
exports.updatePassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Send OTP to Email's Associated Phone
exports.sendOTPByEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 4 * 60 * 1000); // 4 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP via Twilio
    await twilioClient.messages.create({
      body: `Your OTP code is ${otp}. It will expire in 4 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: user.phone,
    });

    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Resend OTP to Email's Associated Phone
exports.resendOTPByEmail = async (req, res) => {
  try {

    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 4 * 60 * 1000); // 4 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();


    // Send OTP via Twilio
    await twilioClient.messages.create({
      body: `Your OTP code is ${otp}. It will expire in 4 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: user.phone,
    });

    res.json({ message: "OTP resent successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Verify OTP by Email
exports.verifyOTPByEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email, otp, otpExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: "Invalid OTP" });

    res.json({
      message: "OTP verified successfully",
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

//resend OTP
exports.resendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    const user = await
      User
        .findOne({ phone });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 4 * 60 * 1000); // 4 minutes

    await User
      .updateOne({ phone }, { otp, otpExpires }, { upsert: true });

    // Send OTP via Twilio
    await twilioClient.messages.create({
      body: `Your OTP code is ${otp}. It will expire in 4 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });

    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Verify OTP Function
exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const user = await User
      .findOne({ phone, otp, otpExpires: { $gt: new Date() } });

    if (!user) return res.status(400).json({ message: "Invalid OTP" });
    res.json({
      message: "OTP verified successfully",
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
    res.status(500).json({ success: false, error: error.message });
  }
}


// check if email exists middleware
exports.checkEmail = async (req, res, next) => {
  try {
    const user = await User.findOne({
      $or: [{
        email: req.body.email
      }, {
        phone: req.body.phone
      }]
    });
    if (user) {
      return res.status(400).json({ error: "User already exists with this email or phone number" });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login User
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found", type: "USER_NOT_FOUND" });
    }
    if (user.isDisabled) {
      return res.status(403).json({ error: "User is disabled", type: "USER_DISABLED" });
    }
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
        email: user.email,
        password: password,
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
    if (!user) {
      return res.status(404).json({ error: "User not found", type: "USER_NOT_FOUND" });
    }
    if (user.isDisabled) {
      return res.status(403).json({ error: "User is disabled", type: "USER_DISABLED" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//Get user location by ID
exports.getUserLocation = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    //add name and address to the location object
    const location = {
      ...user.location,
      name: "Current Location",
      address: "Current Address",
    };
    res.json(location);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
//Update user location by ID
exports.updateUserLocation = async (req, res, io) => {
  try {
    const { latitude, longitude } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        location: { type: "Point", coordinates: [latitude, longitude] },
      },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    const location = {
      ...user.location,
      name: "Current Location",
      address: "Current Address",
    };
    const rideRequest = await RideRequest.findOne({
      user: req.params.id,
      status: "ongoing",
    });

    if (rideRequest) {
      // Emit to driver if driverId is not null
      if (rideRequest.driverId) {
        io.emit(
          "user_location_update_" + rideRequest.driverId,
          JSON.stringify(location)
        );
      }

      // Emit to user if user is not null
      if (rideRequest.user) {
        io.emit(
          "user_location_update_" + rideRequest.user,
          JSON.stringify(location)
        );
      }
    }

    res.json(location);
  } catch (error) {
    res.status(400).json({ error: error.message });
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

// Disable User
exports.disableUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.isDisabled = true; // Set isDisabled to true
    await user.save();

    res.json({ message: "User disabled successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Enable User
exports.enableUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.isDisabled = false; // Set isDisabled to false
    await user.save();

    res.json({ message: "User enabled successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//Delete by phone number
exports.deleteUserByPhone = async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ phone: req.params.phone });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted successfully" });
  }
  catch (error) {
    res.status(500).json({ error: error.message });
  }
}

