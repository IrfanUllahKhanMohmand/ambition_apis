const express = require('express');
const router = express.Router();
const fcmController = require('../controllers/fcmController');

// Register or update FCM token
router.post('/tokens', fcmController.registerToken);
// Get all tokens
router.get('/tokens', fcmController.getAllTokens);

// Get all tokens for a specific user or driver
router.get('/tokens/:ownerType/:ownerId', fcmController.getTokensByOwner);

// Delete a token by deviceId for a specific user or driver
router.delete('/tokens/:ownerType/:ownerId/:deviceId', fcmController.deleteToken);

// Send notification to a specific user or driver (to all their devices)
router.post('/send/:ownerType/:ownerId', fcmController.sendNotificationToOwner);

// Send notification to multiple users or drivers
router.post('/send/bulk', fcmController.sendBulkNotifications);

module.exports = router;