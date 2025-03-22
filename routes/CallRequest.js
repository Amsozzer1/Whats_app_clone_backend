var express = require('express');
var router = express.Router();
var FB_config = require('./../SECRETS');
var firebase = require("firebase/compat/app");
const multer = require('multer');
var upload = multer();


