const mongoose = require('mongoose');

const fcmTokenSchema = new mongoose.Schema({
    // The FCM token value
    token: {
        type: String,
        required: true
    },

    // Device identifier
    deviceId: {
        type: String,
        required: true
    },

    // Reference to either User or Driver
    owner: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        // Discriminator field to identify if this token belongs to a user or driver
        model: {
            type: String,
            enum: ['User', 'Driver'],
            required: true
        }
    },

    // Last time this token was used/updated
    lastActive: {
        type: Date,
        default: Date.now
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create a compound index to ensure uniqueness of token per device per owner
fcmTokenSchema.index(
    {
        deviceId: 1,
        'owner.id': 1,
        'owner.model': 1
    },
    { unique: true }
);

// Create an index on token for quick lookups
fcmTokenSchema.index({ token: 1 });

module.exports = mongoose.model('FcmToken', fcmTokenSchema);