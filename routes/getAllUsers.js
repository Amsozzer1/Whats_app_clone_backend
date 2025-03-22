var express = require('express');
var router = express.Router();
require('dotenv').config();
const multer = require('multer');
var upload = multer();
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK using environment variables
let adminConfig;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // For production: use the JSON string stored in an environment variable
  adminConfig = {
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    )
  };
} else {
  // For local development: use the local file
  const serviceAccount = require('/home/ahmed/Downloads/whatsApp_service_key.json');
  adminConfig = {
    credential: admin.credential.cert(serviceAccount)
  };
}

// Initialize the admin SDK
if (!admin.apps.length) {
  admin.initializeApp(adminConfig);
}

// Rest of your code remains the same

async function listAllUsers(req,res) {
    try {
      // List batch of users, 1000 at a time
      let listUsersResult = await admin.auth().listUsers(1000);
      let users = listUsersResult.users;
      
      // If there are more users, get them using the pageToken
      while (listUsersResult.pageToken) {
        listUsersResult = await admin.auth().listUsers(1000, listUsersResult.pageToken);
        users = users.concat(listUsersResult.users);
      }
      var allUsers = []
      // Process the users
      users.forEach((userRecord) => {
        console.log('User:', userRecord.toJSON());
        allUsers.push(userRecord.toJSON())
      });
      
    //   console.log('Total users:', users.length);
    //   return users;
    res.send(allUsers)
    } catch (error) {
        console.error("Firebase operation failed:", error);
        res.status(500).send("Server error: " + error.message);
    }
  }
router.get('/',listAllUsers);

module.exports = router


