const admin = require("firebase-admin");
const { getStorage } = require("firebase-admin/storage");
const dotenv = require("dotenv");

dotenv.config();

const serviceAccount = require("../config/serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "gs://ambition-automation.appspot.com",
});

const bucket = getStorage().bucket();

const uploadToFirebase = async (req, res, next) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return next();
    }

    const fileUploadPromises = [];

    for (const fieldName in req.files) {
      req.files[fieldName].forEach((file) => {
        if (!file) {
          throw new Error("Please upload all required files");
        }

        if (file.size > 5 * 1024 * 1024) {
          throw new Error("File size should not exceed 5MB");
        }

        const allowedTypes = ["image/jpeg", "image/png"];
        if (!allowedTypes.includes(file.mimetype)) {
          throw new Error("File type not supported");
        }

        const filename = `${Date.now()}-${file.originalname}`;
        const fileRef = bucket.file(filename);

        const uploadPromise = new Promise((resolve, reject) => {
          const blobStream = fileRef.createWriteStream({
            metadata: {
              contentType: file.mimetype,
              metadata: {
                firebaseStorageDownloadTokens: filename,
              },
            },
          });

          blobStream.on("error", (err) => reject(err));

          blobStream.on("finish", async () => {
            const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${
              bucket.name
            }/o/${encodeURIComponent(filename)}?alt=media&token=${filename}`;

            resolve({ fieldName, url: fileUrl });
          });

          blobStream.end(file.buffer);
        });

        fileUploadPromises.push(uploadPromise);
      });
    }

    const uploadedFiles = await Promise.all(fileUploadPromises);

    req.fileUrls = uploadedFiles.reduce((acc, { fieldName, url }) => {
      acc[fieldName] = url;
      return acc;
    }, {});
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = uploadToFirebase;
