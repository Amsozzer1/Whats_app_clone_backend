var express = require('express');
var router = express.Router();
require('dotenv').config();
const multer = require('multer');
var upload = multer();
const admin = require('firebase-admin');

// Initialize Firebase Admin with environment variables
if (!admin.apps.length) {
  let adminConfig;
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // For production: use the environment variable
    adminConfig = {
      credential: admin.credential.cert(
        JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      )
    };
  }
  // else {
  //   // For local development: use the file
  //   const serviceAccount = require('/home/ahmed/Downloads/whatsApp_service_key.json');
  //   adminConfig = {
  //     credential: admin.credential.cert(serviceAccount)
  //   };
  // }
  
  admin.initializeApp(adminConfig);
}

async function getUser(req, res) {
  const userId = req.query.userId;
  
  // Check if userId is provided
  if (!userId) {
    return res.status(400).send("User ID is required");
  }
  
  try {
    // Get a single user directly by their UID
    const userRecord = await admin.auth().getUser(userId);
    res.send(userRecord.toJSON());
  } catch (error) {
    // console.error("Firebase operation failed:", error);
    // Return appropriate error codes
    if (error.code === 'auth/user-not-found') {
      return res.status(404).send("User not found");
    }
    res.status(500).send("Server error: " + error.message);
  }
}

router.get('/', getUser);
module.exports = router;