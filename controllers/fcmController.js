const FcmToken = require('../models/fcmToken');
const User = require('../models/User');
const Driver = require('../models/Driver');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const { initializeFirebaseAdmin } = require('../config/firebase-config');
initializeFirebaseAdmin();

/**
 * Register or update FCM token for a user or driver
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const registerToken = async (req, res) => {
    try {
        const {
            token,
            deviceId,
            ownerId,
            ownerType // 'User' or 'Driver'
        } = req.body;

        // Validate required fields
        if (!token || !deviceId || !ownerId || !ownerType) {
            return res.status(400).json({
                success: false,
                error: 'Token, deviceId, ownerId, and ownerType are required'
            });
        }

        // Validate owner type
        if (ownerType !== 'User' && ownerType !== 'Driver') {
            return res.status(400).json({
                success: false,
                error: 'ownerType must be either "User" or "Driver"'
            });
        }

        // Verify that the owner (User or Driver) exists
        const OwnerModel = ownerType === 'User' ? User : Driver;
        const owner = await OwnerModel.findById(ownerId);

        if (!owner) {
            return res.status(404).json({
                success: false,
                error: `${ownerType} not found`
            });
        }

        // Check if a token already exists for this device and owner
        let fcmToken = await FcmToken.findOne({
            deviceId,
            'owner.id': ownerId,
            'owner.model': ownerType
        });

        if (fcmToken) {
            // Update existing token
            fcmToken.token = token;
            fcmToken.lastActive = new Date();
            await fcmToken.save();

            return res.status(200).json({
                success: true,
                data: fcmToken,
                message: 'Token updated successfully'
            });
        }

        // Create new token
        fcmToken = new FcmToken({
            token,
            deviceId,
            owner: {
                id: ownerId,
                model: ownerType
            },
            lastActive: new Date(),
            createdAt: new Date()
        });

        await fcmToken.save();

        res.status(201).json({
            success: true,
            data: fcmToken,
            message: 'Token registered successfully'
        });
    } catch (error) {
        console.error('Error registering FCM token:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to register FCM token'
        });
    }
};


//Get all tokens
const getAllTokens = async (req, res) => {
    try {
        const tokens = await FcmToken.find();

        res.status(200).json({
            success: true,
            count: tokens.length,
            data: tokens
        });
    } catch (error) {
        console.error('Error fetching FCM tokens:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch FCM tokens'
        });
    }
}

/**
 * Get all tokens for a specific user or driver
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTokensByOwner = async (req, res) => {
    try {
        const { ownerId, ownerType } = req.params;

        // Validate owner type
        if (ownerType !== 'User' && ownerType !== 'Driver') {
            return res.status(400).json({
                success: false,
                error: 'ownerType must be either "User" or "Driver"'
            });
        }

        const tokens = await FcmToken.find({
            'owner.id': ownerId,
            'owner.model': ownerType
        });

        res.status(200).json({
            success: true,
            count: tokens.length,
            data: tokens
        });
    } catch (error) {
        console.error('Error fetching FCM tokens:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch FCM tokens'
        });
    }
};

/**
 * Delete a token by deviceId for a specific user or driver
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteToken = async (req, res) => {
    try {
        const { deviceId, ownerId, ownerType } = req.params;

        // Validate owner type
        if (ownerType !== 'User' && ownerType !== 'Driver') {
            return res.status(400).json({
                success: false,
                error: 'ownerType must be either "User" or "Driver"'
            });
        }

        const result = await FcmToken.findOneAndDelete({
            deviceId,
            'owner.id': ownerId,
            'owner.model': ownerType
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                error: 'Token not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Token deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting FCM token:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete FCM token'
        });
    }
};

/**
 * Send notification to a specific user or driver (to all their devices)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const sendNotificationToOwner = async (req, res) => {
    try {
        const { ownerId, ownerType } = req.params;
        const { title, body, data } = req.body;

        // Validate required fields
        if (!title || !body) {
            return res.status(400).json({
                success: false,
                error: 'Title and body are required'
            });
        }

        // Validate owner type
        if (ownerType !== 'User' && ownerType !== 'Driver') {
            return res.status(400).json({
                success: false,
                error: 'ownerType must be either "User" or "Driver"'
            });
        }

        // Get all tokens for this owner
        const tokenDocs = await FcmToken.find({
            'owner.id': ownerId,
            'owner.model': ownerType
        });

        if (!tokenDocs.length) {
            return res.status(404).json({
                success: false,
                error: 'No FCM tokens found for this owner'
            });
        }

        const tokens = tokenDocs.map(doc => doc.token);

        // Send notification
        const message = {
            notification: {
                title,
                body
            },
            data: data || {},
            tokens
        };

        const response = await admin.messaging().sendEachForMulticast(message);

        // Update lastActive for all tokens
        await FcmToken.updateMany(
            {
                'owner.id': ownerId,
                'owner.model': ownerType
            },
            {
                $set: { lastActive: new Date() }
            }
        );

        res.status(200).json({
            success: true,
            data: {
                successCount: response.successCount,
                failureCount: response.failureCount,
                responses: response.responses
            },
            message: `Notification sent to ${ownerType} successfully`
        });
    } catch (error) {
        console.error('Error sending FCM notification:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send notification'
        });
    }
};

/**
 * Send notification to multiple users or drivers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const sendBulkNotifications = async (req, res) => {
    try {
        const { owners, title, body, data } = req.body;

        // Validate required fields
        if (!owners || !Array.isArray(owners) || !owners.length) {
            return res.status(400).json({
                success: false,
                error: 'Owners array is required'
            });
        }

        if (!title || !body) {
            return res.status(400).json({
                success: false,
                error: 'Title and body are required'
            });
        }

        // Validate owners format
        for (const owner of owners) {
            if (!owner.id || !owner.type || (owner.type !== 'User' && owner.type !== 'Driver')) {
                return res.status(400).json({
                    success: false,
                    error: 'Each owner must have id and type (User or Driver)'
                });
            }
        }

        // Get all tokens for these owners
        const ownerConditions = owners.map(owner => ({
            'owner.id': owner.id,
            'owner.model': owner.type
        }));

        const tokenDocs = await FcmToken.find({ $or: ownerConditions });

        if (!tokenDocs.length) {
            return res.status(404).json({
                success: false,
                error: 'No FCM tokens found for these owners'
            });
        }

        const tokens = tokenDocs.map(doc => doc.token);

        // Send notification
        const message = {
            notification: {
                title,
                body
            },
            data: data || {},
            tokens
        };

        const response = await admin.messaging().sendMulticast(message);

        // Update lastActive for all tokens
        const ownerIds = owners.map(owner => owner.id);
        await FcmToken.updateMany(
            { 'owner.id': { $in: ownerIds } },
            { $set: { lastActive: new Date() } }
        );

        res.status(200).json({
            success: true,
            data: {
                successCount: response.successCount,
                failureCount: response.failureCount,
                responses: response.responses
            },
            message: 'Bulk notifications sent successfully'
        });
    } catch (error) {
        console.error('Error sending bulk FCM notifications:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send bulk notifications'
        });
    }
};

module.exports = {
    registerToken,
    getAllTokens,
    getTokensByOwner,
    deleteToken,
    sendNotificationToOwner,
    sendBulkNotifications
};