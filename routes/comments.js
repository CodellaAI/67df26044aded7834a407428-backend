
const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

// Like a comment (protected)
router.post('/:id/like', protect, commentController.likeComment);

// Unlike a comment (protected)
router.delete('/:id/unlike', protect, commentController.unlikeComment);

// Delete a comment (protected)
router.delete('/:id', protect, commentController.deleteComment);

module.exports = router;
