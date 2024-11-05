const admin = require("firebase-admin");
const { getStorage } = require("firebase-admin/storage");
const dotenv = require("dotenv");

dotenv.config();

var serviceAccount = require("../config/serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "gs://ambition-automation.appspot.com",
});

const bucket = getStorage().bucket();

const uploadToFirebase = async (req, res, next) => {
  try {
    console.log(req.files);
    const profile = req.files.profile[0];
    const nationalIdFront = req.files.nationalIdFront[0];
    const nationalIdBack = req.files.nationalIdBack[0];
    const driverLicenseFront = req.files.driverLicenseFront[0];
    const driverLicenseBack = req.files.driverLicenseBack[0];

    const files = [
      profile,
      nationalIdFront,
      nationalIdBack,
      driverLicenseFront,
      driverLicenseBack,
    ];

    files.forEach((file) => {
      if (!file) {
        return res.status(400).json({
          success: false,
          message: "Please upload all required files",
        });
      }
    });

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: "File size should not exceed 5MB",
        });
      }
    });

    files.forEach((file) => {
      const allowedTypes = ["image/jpeg", "image/png"];
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: "File type not supported",
        });
      }
    });

    files.forEach((file) => {
      const filename = `${Date.now()}-${file.originalname}`;
      const fileRef = bucket.file(filename);

      const blobStream = fileRef.createWriteStream({
        metadata: {
          contentType: file.mimetype,
          metadata: {
            firebaseStorageDownloadTokens: filename,
          },
        },
      });

      blobStream.on("error", (err) => {
        res.status(500).json({
          success: false,
          message: err.message,
        });
      });

      blobStream.on("finish", async () => {
        const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${
          bucket.name
        }/o/${encodeURIComponent(filename)}?alt=media&token=${filename}`;

        const fileField = file.fieldname;
        req[fileField] = fileUrl;
      });

      blobStream.end(file.buffer);
    });

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = uploadToFirebase;
