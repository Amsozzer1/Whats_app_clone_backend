// const firebaseConfig = {
//     apiKey: "AIzaSyBhWy_Lwyrr4isMoItVw07izKH7-0RKpMM",
//     authDomain: "whatsapp-16bff.firebaseapp.com",
//     projectId: "whatsapp-16bff",
//     storageBucket: "whatsapp-16bff.firebasestorage.app",
//     messagingSenderId: "1054873574084",
//     appId: "1:1054873574084:web:9fd089b19f37308221c791",
//     measurementId: "G-7XV6V8HFMC"
// };
// export default firebaseConfig;

// firebaseConfig.js
// require('dotenv').config();
// firebase.js
import dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// const app = initializeApp(firebaseConfig);

// module.exports = app;
// export default firebaseConfig;
module.exports = {
    firebaseConfig
  };
