
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { uploadAvatar, handleMulterError } = require('../middleware/upload');

// Get user by username
router.get('/:username', userController.getUserByUsername);

// Get user by ID
router.get('/id/:id', userController.getUserById);

// Update user profile (protected)
router.put('/profile', protect, uploadAvatar, handleMulterError, userController.updateProfile);

// Follow a user (protected)
router.post('/follow/:id', protect, userController.followUser);

// Unfollow a user (protected)
router.delete('/unfollow/:id', protect, userController.unfollowUser);

// Check if following a user (protected)
router.get('/check-follow/:id', protect, userController.checkFollow);

// Get user's followers
router.get('/:id/followers', userController.getFollowers);

// Get users followed by a user
router.get('/:id/following', userController.getFollowing);

// Get suggested users (protected)
router.get('/suggested/users', protect, userController.getSuggestedUsers);

// Search users
router.get('/search/query', userController.searchUsers);

module.exports = router;
