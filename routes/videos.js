
const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const commentController = require('../controllers/commentController');
const { protect, optionalAuth } = require('../middleware/auth');
const { uploadVideo, handleMulterError } = require('../middleware/upload');

// Upload a new video (protected)
router.post('/', protect, uploadVideo, handleMulterError, videoController.uploadVideo);

// Get all videos (with optional auth)
router.get('/', optionalAuth, videoController.getAllVideos);

// Get video by ID (with optional auth)
router.get('/:id', optionalAuth, videoController.getVideoById);

// Get videos by user ID (with optional auth)
router.get('/user/:userId', optionalAuth, videoController.getVideosByUser);

// Get videos for following feed (protected)
router.get('/feed/following', protect, videoController.getFollowingVideos);

// Like a video (protected)
router.post('/:id/like', protect, videoController.likeVideo);

// Unlike a video (protected)
router.delete('/:id/unlike', protect, videoController.unlikeVideo);

// Check if user liked a video (protected)
router.get('/:id/check-like', protect, videoController.checkLike);

// Delete a video (protected)
router.delete('/:id', protect, videoController.deleteVideo);

// Search videos
router.get('/search/query', optionalAuth, videoController.searchVideos);

// Comment routes
// Add a comment to a video (protected)
router.post('/:videoId/comments', protect, commentController.addComment);

// Get comments for a video (with optional auth)
router.get('/:videoId/comments', optionalAuth, commentController.getVideoComments);

module.exports = router;
