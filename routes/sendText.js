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

async function sendText(req, res) {
    const { senderID, recieverID } = req.query;
    var Ref = db.collection(senderID).doc(recieverID);
    var Ref2= db.collection(recieverID).doc(senderID);
    console.log(req.body);
    try {
      const doc = await Ref.get();
      const doc2 = await Ref2.get();
      
      const newMessage = {
        "message": req.body.message,
        "isUser": true,
        'timestamp': req.body.timestamp,
        'sender': recieverID,
      };
      const newMessage2 = {
        "message": req.body.message,
        "isUser": false,
        'timestamp': req.body.timestamp,
        'sender': recieverID,
      }
      
      if (!doc.exists) {
        await Ref.set({
          
          chat: [newMessage]
        });
      } else {
        const currentData = doc.data();
        const chatArray = currentData.chat || [];
        chatArray.push(newMessage);
        
        await Ref.set({
          chat: chatArray
        }, { merge: true });
      }


      if (!doc2.exists) {
        await Ref2.set({
          chat: [newMessage2]
        });
      } else {
        const currentData = doc2.data();
        const chatArray = currentData.chat || [];
        chatArray.push(newMessage2);
        
        await Ref2.set({
          chat: chatArray
        }, { merge: true });
      }
      
      res.send({result:'ok'});
    } catch (error) {
      console.error("Error adding message:", error);
      res.status(500).send(`Error: ${error.message}`);
    }
  }
router.put('/',upload.none(),sendText);
module.exports = router;