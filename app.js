var createError = require('http-errors');
var express = require('express');
const cors = require('cors');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var crypto = require('crypto');
var app = express();

const server = require('http').createServer(app);
const expressWs = require('express-ws')(app, server);


const StreamChat = require('stream-chat').StreamChat;
require('dotenv').config();
const apiKey = process.env.API_KEY;
const apiSecret = process.env.API_SECRET;

const serverClient = StreamChat.getInstance(apiKey, apiSecret);
// Initialize express-ws
// var expressWs = require('express-ws')(app);

// Store connected users
const connectedUsers = {};

// Add these headers explicitly to handle CORS before any routes
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  // Add these headers to fix the Cross-Origin-Opener-Policy issue
  res.header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.header('Cross-Origin-Embedder-Policy', 'require-corp');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Your other middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
console.log('WebSocket initialized:', !!expressWs);
app.get('/socket-test', (req, res) => {
  res.send('WebSocket endpoint is configured and server is running');
});
// WebSocket endpoint for real-time communication
app.ws('/socket', function(ws, req) {
  let userId = null;
  
  console.log('Client connected to WebSocket');
  
  ws.on('message', function(msg) {
    try {
      const data = JSON.parse(msg);
      console.log('WebSocket message received:', data);
      
      // Handle user registration
      if (data.type === 'register') {
        userId = data.userId;
        connectedUsers[userId] = ws;
        console.log(`User ${userId} registered with WebSocket`);
        // const userId = data.userId;
        const token = serverClient.createToken(userId);
        // Confirm registration to client
        ws.send(JSON.stringify({ 
          type: 'registered', 
          success: true,
          token:token

        }));
      }
      else if (data.type === 'call_canceled') {
        console.log('Handling call_canceled message');
        console.log('Looking for receiver:', data.receiverId);
        console.log('Current connected users:', Object.keys(connectedUsers));
        
        const receiverWs = connectedUsers[data.receiverId];
        if (receiverWs) {
          console.log('Found receiver, forwarding message');
          try {
            receiverWs.send(JSON.stringify(data));
            console.log('Message forwarded successfully');
          } catch (error) {
            console.error('Error forwarding message:', error);
          }
        } else {
          console.log('Receiver not found in connected users');
        }
      }
      // Handle call requests
      else if (data.type === 'call_request') {
        const { receiverId, callerId, callerName } = data;
        const receiverWs = connectedUsers[receiverId];
        // const userId = data.callerId;
        // const token = serverClient.createToken(userId);
        if (receiverWs) {
          // Send notification to receiver
          receiverWs.send(JSON.stringify({
            type: 'incoming_call',
            callerId,
            callerName
          }));
          
          // Notify caller that request was sent
          ws.send(JSON.stringify({
            type: 'call_status',
            status: 'ringing',
            receiverId,
            // token:token
          }));
          
          console.log(`Call request sent from ${callerId} to ${receiverId}`);
        } else {
          // Receiver not connected
          ws.send(JSON.stringify({
            type: 'call_status',
            status: 'unavailable',
            receiverId
          }));
          
          console.log(`Receiver ${receiverId} not connected`);
        }
      }
      
      // Handle call responses (accept/decline)
      else if (data.type === 'call_response') {
        const { callerId, response } = data;
        // const callerWs = connectedUsers[callerId];
        const receiverWs = connectedUsers[data.callerId];
        
        if(receiverWs){
          if (response==='accepted') {
            // const userId = data.userID;
            // const token = serverClient.createToken(userId);
            receiverWs.send(JSON.stringify({
              type: 'call_info',
              callID: data.callID,
              // token:token
            }));
            
            console.log(`Call ${response} by ${userId} to ${callerId}`);
          }
          else{
            // console.log("WS: ",ws);
            receiverWs.send(JSON.stringify({
              type: 'call_response',
              callerId,
              status:'declined',
              // weird: "I SHOULD BE HERE"
            }))
          }
        }
      }
      else if(data.type == "message_sent"){
        const receiverWs = connectedUsers[data.receiver];
        let newMessage = data.message;
        newMessage.isUser=false
        if(receiverWs){
          receiverWs.send(JSON.stringify({
            type:"message_sent",
            message:newMessage,
            sender: data.sender,
            receiver:data.receiver
          }))
      }
    }
      
      
    } catch (e) {
      console.error('Error handling WebSocket message:', e);
    }
  });
  
  // Handle disconnection
  ws.on('close', function() {
    if (userId) {
      console.log(`User ${userId} disconnected from WebSocket`);
      delete connectedUsers[userId];
    }
  });
});

// Your routes
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var createUserRouter = require('./routes/createUser');
var getChats = require('./routes/getChats');
var sendText = require('./routes/sendText');
var addUser = require('./routes/addUser');
var allUsers = require('./routes/getAllUsers');
var getUser = require('./routes/getUser');
const { type } = require('os');

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/createUser', createUserRouter);
app.use('/getChats', getChats);
app.use('/sendText', sendText);
app.use('/addUser',addUser);
app.use('/allUsers',allUsers);
app.use('/getUser',getUser);


// Add this to your Express routes
app.get('/test-message/:userId', (req, res) => {
  const userId = req.params.userId;
  const receiverWs = connectedUsers[userId];
  
  if (receiverWs) {
    try {
      receiverWs.send(JSON.stringify({
        type: 'test_message',
        message: 'This is a test message'
      }));
      res.send('Test message sent to ' + userId);
    } catch (error) {
      res.status(500).send('Error sending message: ' + error.message);
    }
  } else {
    res.status(404).send('User not found in connected users');
  }
});

// 404 handler
app.use(function(req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  
  // Send error as JSON for all API requests
  return res.json({
    error: err.message,
    status: err.status || 500
  });
});

// app.listen(3006, () => {
//   console.log(`Server with WebSocket support listening on port 3006`);
// });
const PORT = process.env.PORT || 3006;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;