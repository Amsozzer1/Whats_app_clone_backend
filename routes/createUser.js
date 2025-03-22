var express = require('express');
var router = express.Router();
var FB_config = require('./../SECRETS');
var firebase = require("firebase/compat/app");
// require("firebase/compat/firestore"); 
var dummyChats = require('../DummyChats');


var dummy_users = ["gD0Urk0aoQQUc9xzC1R7f7rHxKB3","4NIcVjLMO6gOhtC2sTnL9zYTPQI3","qSE5wMxZSyeO4HyiFN0MH0SSWmm1"];
let db;
function initFirebase() {
if (!firebase.apps.length) {
firebase.initializeApp(FB_config.default);
}

db = firebase.firestore();
return db;
}

const firestoreDb = initFirebase();


router.put('/', async (req, res) => {
try {
    
    const promises = [];
    
    for (var i = 0; i < 3; i++) {
        promises.push(
        firestoreDb.collection(req.query.userID)
        .doc(dummy_users[i])
        .set({
            userId: dummy_users[i],
            chat: dummyChats.Dummy_chat[i],
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        })
        );
    }
    
    const results = await Promise.all(promises);
    
    res.send({
        message: `Created ${results.length} users in collection ${req.query.userID}`,
        // documentIds: results.map(docRef => docRef.id)
    });
    
    } catch (error) {
    console.error("Firebase operation failed:", error);
    res.status(500).send("Server error: " + error.message);
    }
});

module.exports = router;