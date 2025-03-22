
const Comment = require('../models/Comment');
const Video = require('../models/Video');
const Like = require('../models/Like');

// Add a comment to a video
exports.addComment = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const { content, parentId } = req.body;
    const userId = req.user._id;
    
    if (!content) {
      return res.status(400).json({
        status: 'error',
        message: 'Comment content is required'
      });
    }
    
    // Check if video exists
    const video = await Video.findById(videoId);
    
    if (!video) {
      return res.status(404).json({
        status: 'error',
        message: 'Video not found'
      });
    }
    
    // Create comment data
    const commentData = {
      video: videoId,
      user: userId,
      content
    };
    
    // If it's a reply, add parent comment reference
    if (parentId) {
      // Check if parent comment exists
      const parentComment = await Comment.findById(parentId);
      
      if (!parentComment) {
        return res.status(404).json({
          status: 'error',
          message: 'Parent comment not found'
        });
      }
      
      commentData.parent = parentId;
    }
    
    // Create comment
    const comment = await Comment.create(commentData);
    
    // Increment comment count on video
    video.comments += 1;
    await video.save();
    
    // Populate user data
    await comment.populate('user', 'username avatar');
    
    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
};

// Get comments for a video
exports.getVideoComments = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const { parentId } = req.query;
    
    // Query base
    const query = { video: videoId };
    
    // If parentId is provided, get replies to that comment
    // Otherwise, get top-level comments (parent is null)
    if (parentId) {
      query.parent = parentId;
    } else {
      query.parent = null;
    }
    
    // Get comments
    const comments = await Comment.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'username avatar');
    
    // If user is authenticated, check if they liked each comment
    if (req.user) {
      const commentIds = comments.map(comment => comment._id);
      const likes = await Like.find({
        user: req.user._id,
        comment: { $in: commentIds }
      });
      
      const likedCommentIds = likes.map(like => like.comment.toString());
      
      // Add isLiked flag to each comment
      comments.forEach(comment => {
        comment._doc.isLiked = likedCommentIds.includes(comment._id.toString());
      });
    }
    
    res.status(200).json(comments);
  } catch (error) {
    next(error);
  }
};

// Like a comment
exports.likeComment = async (req, res, next) => {
  try {
    const { id } = req.params; // Comment ID
    const userId = req.user._id;
    
    // Check if comment exists
    const comment = await Comment.findById(id);
    
    if (!comment) {
      return res.status(404).json({
        status: 'error',
        message: 'Comment not found'
      });
    }
    
    // Check if already liked
    const existingLike = await Like.findOne({
      user: userId,
      comment: id
    });
    
    if (existingLike) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already liked this comment'
      });
    }
    
    // Create like
    await Like.create({
      user: userId,
      comment: id
    });
    
    // Increment likes count
    comment.likes += 1;
    await comment.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Comment liked successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Unlike a comment
exports.unlikeComment = async (req, res, next) => {
  try {
    const { id } = req.params; // Comment ID
    const userId = req.user._id;
    
    // Check if comment exists
    const comment = await Comment.findById(id);
    
    if (!comment) {
      return res.status(404).json({
        status: 'error',
        message: 'Comment not found'
      });
    }
    
    // Check if liked
    const existingLike = await Like.findOne({
      user: userId,
      comment: id
    });
    
    if (!existingLike) {
      return res.status(400).json({
        status: 'error',
        message: 'You have not liked this comment'
      });
    }
    
    // Remove like
    await Like.findOneAndDelete({
      user: userId,
      comment: id
    });
    
    // Decrement likes count
    if (comment.likes > 0) {
      comment.likes -= 1;
      await comment.save();
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Comment unliked successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Delete a comment
exports.deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params; // Comment ID
    const userId = req.user._id;
    
    // Find comment
    const comment = await Comment.findById(id);
    
    if (!comment) {
      return res.status(404).json({
        status: 'error',
        message: 'Comment not found'
      });
    }
    
    // Check if user owns the comment
    if (comment.user.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only delete your own comments'
      });
    }
    
    // Get video to update comment count
    const video = await Video.findById(comment.video);
    
    // Delete all likes for this comment
    await Like.deleteMany({ comment: id });
    
    // Delete all replies to this comment
    const replies = await Comment.find({ parent: id });
    
    // Decrement video comment count for each reply
    if (video && replies.length > 0) {
      video.comments -= replies.length;
    }
    
    await Comment.deleteMany({ parent: id });
    
    // Delete the comment
    await Comment.findByIdAndDelete(id);
    
    // Decrement comment count on video
    if (video) {
      video.comments -= 1;
      await video.save();
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
