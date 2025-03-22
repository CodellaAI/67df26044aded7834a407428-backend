
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Register new user
router.post('/register', authController.register);

// Login user
router.post('/login', authController.login);

// Get current user (protected route)
router.get('/me', protect, authController.getCurrentUser);

module.exports = router;
