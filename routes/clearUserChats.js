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

async function deleteAllDocumentsInCollection(req, res) {
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
    
    // Count documents to delete
    const docCount = snapshot.size;
    
    // Create a batch to perform multiple deletes
    const batchSize = 500; // Firestore batch limit is 500 operations
    let totalDeleted = 0;
    
    // Process deletion in batches
    const deletePromises = [];
    let batch = db.batch();
    let operationCount = 0;
    
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
      operationCount++;
      
      // If we reach batch size limit, commit and create a new batch
      if (operationCount >= batchSize) {
        deletePromises.push(batch.commit());
        batch = db.batch();
        totalDeleted += operationCount;
        operationCount = 0;
      }
    });
    
    // Commit any remaining operations
    if (operationCount > 0) {
      deletePromises.push(batch.commit());
      totalDeleted += operationCount;
    }
    
    // Wait for all batch operations to complete
    await Promise.all(deletePromises);
    
    res.send({
      success: true,
      message: `Successfully deleted ${totalDeleted} documents from collection '${collectionName}'`
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      error: error.message
    });
  }
}

// Define the route for deleting all documents
router.delete('/', deleteAllDocumentsInCollection);

module.exports = router;