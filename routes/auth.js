const express = require('express');
const authRouter = express.Router();

const authController = require('../controllers/authController');

authRouter.post('/signup', authController.signUp);

module.exports = authRouter;