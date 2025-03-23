var express = require('express');
var router = express.Router();
var FB_config = require('./../SECRETS');
var firebase = require("firebase/compat/app");
require("firebase/compat/firestore");
let db;

function initFirebase() {
  if (!firebase.apps.length) {
    firebase.initializeApp(FB_config.default);
  }
  db = firebase.firestore();
  return db;
}

const firestoreDb = initFirebase();

async function clearChatFieldInAllDocuments(req, res) {
  // Get collection name from request
  const collectionName = req.query.collection || req.body.collection;
  
  if (!collectionName) {
    return res.status(400).send({
      success: false,
      error: "Missing collection parameter"
    });
  }
  
  try {
    // Get a reference to the collection
    const collectionRef = db.collection(collectionName);
    
    // Get all documents in the collection
    const snapshot = await collectionRef.get();
    
    if (snapshot.empty) {
      return res.send({
        success: true,
        message: `No documents found in collection '${collectionName}'`
      });
    }
    
    // Count documents to update
    const docCount = snapshot.size;
    
    // Create a batch to perform multiple updates
    const batchSize = 500; // Firestore batch limit is 500 operations
    let totalUpdated = 0;
    
    // Process updates in batches
    const updatePromises = [];
    let batch = db.batch();
    let operationCount = 0;
    
    snapshot.forEach(doc => {
      // Update the document to set chat field to empty array
      batch.update(doc.ref, { chat: [] });
      operationCount++;
      
      // If we reach batch size limit, commit and create a new batch
      if (operationCount >= batchSize) {
        updatePromises.push(batch.commit());
        batch = db.batch();
        totalUpdated += operationCount;
        operationCount = 0;
      }
    });
    
    // Commit any remaining operations
    if (operationCount > 0) {
      updatePromises.push(batch.commit());
      totalUpdated += operationCount;
    }
    
    // Wait for all batch operations to complete
    await Promise.all(updatePromises);
    
    res.send({
      success: true,
      message: `Successfully updated chat field to empty array in ${totalUpdated} documents from collection '${collectionName}'`
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      error: error.message
    });
  }
}

// Define the route for clearing chat field
router.delete('/', clearChatFieldInAllDocuments);

module.exports = router;