var express = require('express');
var router = express.Router();
var FB_config = require('../SECRETS');

// Client Firebase for Firestore
var firebase = require("firebase/compat/app");
require("firebase/compat/firestore");

// Firebase Admin SDK for Auth operations
var admin = require("firebase-admin");

// Initialize Firebase client SDK
let db;
function initFirebase() {
  if (!firebase.apps.length) {
    firebase.initializeApp(FB_config.default);
  }
  db = firebase.firestore();
  return db;
}

// Initialize Firebase Admin SDK (for auth operations)
// Check if Admin SDK is already initialized to avoid multiple initializations
let adminAuth;
function initAdmin() {
  try {
    if (!admin.apps.length) {
      // This assumes you have service account credentials in SECRETS
      admin.initializeApp({
        credential: admin.credential.cert(FB_config.serviceAccount)
      });
    }
    adminAuth = admin.auth();
    return adminAuth;
  } catch (error) {
    console.error("Error initializing Admin SDK:", error);
    return null;
  }
}

const firestoreDb = initFirebase();
const adminAuthInstance = initAdmin();

async function deleteUserAndCollection(req, res) {
  // Get user ID from request
  const userId = req.query.userId || req.body.userId;
  
  if (!userId) {
    return res.status(400).send({
      success: false,
      error: "Missing userId parameter"
    });
  }
  
  try {
    // Keep track of operations
    let userDocDeleted = false;
    let authUserDeleted = false;
    let docsDeleted = 0;
    let errors = [];
    
    // 1. Delete the user from Firebase Authentication using Admin SDK
    if (adminAuthInstance) {
      try {
        await adminAuthInstance.deleteUser(userId);
        authUserDeleted = true;
      } catch (authError) {
        if (authError.code === 'auth/user-not-found') {
          errors.push('Authentication user not found.');
        } else {
          errors.push(`Auth deletion error: ${authError.message}`);
        }
      }
    } else {
      errors.push('Firebase Admin SDK not properly initialized. Authentication user was not deleted.');
    }
    
    // 2. Delete the user document from Firestore
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      await userRef.delete();
      userDocDeleted = true;
    }
    
    // 3. Delete all documents in the collection with the same name as userId
    const collectionRef = db.collection(userId);
    const snapshot = await collectionRef.get();
    
    if (!snapshot.empty) {
      // Create batches to handle potentially large collections
      const batchSize = 500; // Firestore batch limit
      const deletePromises = [];
      let batch = db.batch();
      let operationCount = 0;
      
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
        operationCount++;
        docsDeleted++;
        
        // If we reach batch size limit, commit and create a new batch
        if (operationCount >= batchSize) {
          deletePromises.push(batch.commit());
          batch = db.batch();
          operationCount = 0;
        }
      });
      
      // Commit any remaining operations
      if (operationCount > 0) {
        deletePromises.push(batch.commit());
      }
      
      // Wait for all batch operations to complete
      await Promise.all(deletePromises);
    }
    
    // 4. Handle case where no documents were deleted
    if (!userDocDeleted && !authUserDeleted && docsDeleted === 0) {
      return res.status(404).send({
        success: false,
        message: `No user or collection found with ID: ${userId}`
      });
    }
    
    // 5. Return success response with details
    res.send({
      success: true,
      userDocDeleted: userDocDeleted,
      authUserDeleted: authUserDeleted,
      collectionDocumentsDeleted: docsDeleted,
      warnings: errors.length > 0 ? errors : undefined,
      message: `User document deletion: ${userDocDeleted ? 'Successful' : 'Document not found'}. Auth user deletion: ${authUserDeleted ? 'Successful' : 'Failed'}. Deleted ${docsDeleted} documents from collection '${userId}'`
    });
    
  } catch (error) {
    res.status(500).send({
      success: false,
      error: error.message
    });
  }
}

// Define the route for deleting user and their collection
router.delete('/', deleteUserAndCollection);

module.exports = router;