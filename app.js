var createError = require('http-errors');
var express = require('express');
const cors = require('cors');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var crypto = require('crypto');
var app = express();

// Don't create server here - it will be created in bin/www
// Remove these lines:
// const server = require('http').createServer(app);
// const expressWs = require('express-ws')(app, server);

const StreamChat = require('stream-chat').StreamChat;
require('dotenv').config();
const apiKey = process.env.API_KEY;
const apiSecret = process.env.API_SECRET;

const serverClient = StreamChat.getInstance(apiKey, apiSecret);

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

app.get('/socket-test', (req, res) => {
  res.send('WebSocket endpoint is configured and server is running');
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

// Export the app, connectedUsers, and serverClient for use in bin/www
module.exports = { 
  app, 
  connectedUsers, 
  serverClient 
};