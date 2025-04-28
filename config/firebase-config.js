const admin = require('firebase-admin');
const serviceAccount = require("../ambition-automation-firebase-adminsdk.json");
// Initialize Firebase Admin SDK if not already initialized
const initializeFirebaseAdmin = () => {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }

    return admin;
};

module.exports = { initializeFirebaseAdmin };