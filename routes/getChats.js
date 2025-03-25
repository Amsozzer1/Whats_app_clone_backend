var express = require('express');
var router = express.Router();
var FB_config = require('./../SECRETS');
var firebase = require("firebase/compat/app");
require("firebase/compat/firestore");
var dummy_users = ["WHZ5HjPQZPffbiaszXGk2klUkrA3","G0vQ0uA8XtaIct5WkEGAkjTDgnR2","zdpXED21QfZjMXtIKsdcG8wAGxL2"]
// ["gD0Urk0aoQQUc9xzC1R7f7rHxKB3", "4NIcVjLMO6gOhtC2sTnL9zYTPQI3", "qSE5wMxZSyeO4HyiFN0MH0SSWmm1"];
var dummyChats = require('../DummyChats');
let db;

function initFirebase() {
  if (!firebase.apps.length) {
    firebase.initializeApp(FB_config.default);
  }
  db = firebase.firestore();
  return db;
}

const firestoreDb = initFirebase();

async function getCollectionData(collectionName) {
  try {
    const querySnapshot = await db.collection(collectionName).get();
    const documents = []
    
    querySnapshot.forEach((doc) => {
      documents.push({
        id: doc.id,
        data: doc.data()
      });
    });
    
    // If collection is empty, populate with dummy data
    if (documents.length <= 0) {
      const promises = [];
      
      for (var i = 0; i < 3; i++) {
        promises.push(
          firestoreDb.collection(collectionName)
            .doc(dummy_users[i])
            .set({
              userId: "Dummy " + String(i),
              chat: dummyChats.Dummy_chat[i],
              timestamp: firebase.firestore.FieldValue.serverTimestamp()
            })
        );
      }
      
      try {
        await Promise.all(promises);
        
        // Get the newly created documents
        const querySnapshot2 = await db.collection(collectionName).get();
        const documents2 = [];
        
        querySnapshot2.forEach((doc) => {
          documents2.push({
            id: doc.id,
            data: doc.data()
          });
        });
        
        return documents2;
      } catch (error) {
        console.error("Firebase operation failed:", error);
        return { error: "Error creating dummy data: " + error.message };
      }
    }
    
    return documents;
  } catch (error) {
    console.error("Error getting collection data:", error);
    return { error: "Error retrieving collection data: " + error.message };
  }
}

router.get('/', async (req, res) => {
  const collectionName = req.query.CollectionName;
  
  if (!collectionName) {
    return res.status(400).send('Missing CollectionName parameter');
  }
  
  const result = await getCollectionData(collectionName);
  
  // Check if there was an error
  if (result.error) {
    return res.status(500).send(result.error);
  }
  
  // Send successful response
  res.send({
    collectionName,
    documentCount: result.length,
    documents: result
  });
});

module.exports = router;