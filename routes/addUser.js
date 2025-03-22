var express = require('express');
var router = express.Router();
var FB_config = require('./../SECRETS');
var firebase = require("firebase/compat/app");
const multer = require('multer');
var upload = multer();

let db;
function initFirebase() {
    if (!firebase.apps.length) {
        firebase.initializeApp(FB_config.default);
    }
    db = firebase.firestore();
    return db;
}

const firestoreDb = initFirebase();

async function helper(req,res){
    const{adder,added,userId} = req.query;
    try{
        var data = await firestoreDb.collection(adder).doc(added).get();
        if(data.exists){
            throw("Record already exists")
        }
        firestoreDb.collection(adder)
        .doc(added)
        .set({
            userId: userId,
            chat: [],
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        })

        res.send({
            message:"User " + userId + " with uid " + added + " has been added as a friend to " + adder,
            success: true
        })
    }
    catch (error) {
        console.error("Firebase operation failed:", error);
        res.status(500).send("Server error: " + error);
    }
    
}

router.put('/',helper);

module.exports = router;