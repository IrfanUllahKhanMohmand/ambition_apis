const mongoose = require('mongoose');

const userTempOtpSchema = new mongoose.Schema({
    phone: { type: String, unique: true },
    otp: { type: String },
    otpExpires: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('UserTempOtp', userTempOtpSchema);