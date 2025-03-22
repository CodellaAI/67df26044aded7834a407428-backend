
const Video = require('../models/Video');
const User = require('../models/User');
const Like = require('../models/Like');
const Comment = require('../models/Comment');
const Follow = require('../models/Follow');
const fs = require('fs-extra');
const path = require('path');

// Upload a new video
exports.uploadVideo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Please upload a video file'
      });
    }
    
    const { caption, tags } = req.body;
    
    if (!caption) {
      return res.status(400).json({
        status: 'error',
        message: 'Caption is required'
      });
    }
    
    // Process tags if provided
    let tagArray = [];
    if (tags) {
      tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }
    
    // Create new video
    const video = await Video.create({
      user: req.user._id,
      videoUrl: `/uploads/videos/${req.file.filename}`,
      caption,
      tags: tagArray
    });
    
    // Populate user data
    await video.populate('user', 'username avatar');
    
    res.status(201).json(video);
  } catch (error) {
    next(error);
  }
};

// Get all videos (with pagination)
exports.getAllVideos = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const videos = await Video.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username avatar');
    
    // If user is authenticated, check if they liked each video
    if (req.user) {
      const videoIds = videos.map(video => video._id);
      const likes = await Like.find({
        user: req.user._id,
        video: { $in: videoIds }
      });
      
      const likedVideoIds = likes.map(like => like.video.toString());
      
      // Add isLiked flag to each video
      videos.forEach(video => {
        video._doc.isLiked = likedVideoIds.includes(video._id.toString());
      });
    }
    
    res.status(200).json(videos);
  } catch (error) {
    next(error);
  }
};

// Get video by ID
exports.getVideoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const video = await Video.findById(id)
      .populate('user', 'username avatar');
    
    if (!video) {
      return res.status(404).json({
        status: 'error',
        message: 'Video not found'
      });
    }
    
    // Increment views
    video.views += 1;
    await video.save();
    
    // If user is authenticated, check if they liked the video
    if (req.user) {
      const like = await Like.findOne({
        user: req.user._id,
        video: id
      });
      
      video._doc.isLiked = !!like;
    }
    
    res.status(200).json(video);
  } catch (error) {
    next(error);
  }
};

// Get videos by user ID
exports.getVideosByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const videos = await Video.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('user', 'username avatar');
    
    // If user is authenticated, check if they liked each video
    if (req.user) {
      const videoIds = videos.map(video => video._id);
      const likes = await Like.find({
        user: req.user._id,
        video: { $in: videoIds }
      });
      
      const likedVideoIds = likes.map(like => like.video.toString());
      
      // Add isLiked flag to each video
      videos.forEach(video => {
        video._doc.isLiked = likedVideoIds.includes(video._id.toString());
      });
    }
    
    res.status(200).json(videos);
  } catch (error) {
    next(error);
  }
};

// Get videos for following feed
exports.getFollowingVideos = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    
    // Get IDs of users being followed
    const following = await Follow.find({ follower: currentUserId })
      .select('following');
    
    const followingIds = following.map(follow => follow.following);
    
    // If not following anyone, return empty array
    if (followingIds.length === 0) {
      return res.status(200).json([]);
    }
    
    // Get videos from followed users
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const videos = await Video.find({ user: { $in: followingIds } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username avatar');
    
    // Check if current user liked each video
    const videoIds = videos.map(video => video._id);
    const likes = await Like.find({
      user: currentUserId,
      video: { $in: videoIds }
    });
    
    const likedVideoIds = likes.map(like => like.video.toString());
    
    // Add isLiked flag to each video
    videos.forEach(video => {
      video._doc.isLiked = likedVideoIds.includes(video._id.toString());
    });
    
    res.status(200).json(videos);
  } catch (error) {
    next(error);
  }
};

// Like a video
exports.likeVideo = async (req, res, next) => {
  try {
    const { id } = req.params; // Video ID
    const userId = req.user._id;
    
    // Check if video exists
    const video = await Video.findById(id);
    
    if (!video) {
      return res.status(404).json({
        status: 'error',
        message: 'Video not found'
      });
    }
    
    // Check if already liked
    const existingLike = await Like.findOne({
      user: userId,
      video: id
    });
    
    if (existingLike) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already liked this video'
      });
    }
    
    // Create like
    await Like.create({
      user: userId,
      video: id
    });
    
    // Increment likes count
    video.likes += 1;
    await video.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Video liked successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Unlike a video
exports.unlikeVideo = async (req, res, next) => {
  try {
    const { id } = req.params; // Video ID
    const userId = req.user._id;
    
    // Check if video exists
    const video = await Video.findById(id);
    
    if (!video) {
      return res.status(404).json({
        status: 'error',
        message: 'Video not found'
      });
    }
    
    // Check if liked
    const existingLike = await Like.findOne({
      user: userId,
      video: id
    });
    
    if (!existingLike) {
      return res.status(400).json({
        status: 'error',
        message: 'You have not liked this video'
      });
    }
    
    // Remove like
    await Like.findOneAndDelete({
      user: userId,
      video: id
    });
    
    // Decrement likes count
    if (video.likes > 0) {
      video.likes -= 1;
      await video.save();
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Video unliked successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Check if user liked a video
exports.checkLike = async (req, res, next) => {
  try {
    const { id } = req.params; // Video ID
    const userId = req.user._id;
    
    // Check if liked
    const existingLike = await Like.findOne({
      user: userId,
      video: id
    });
    
    res.status(200).json({
      status: 'success',
      liked: !!existingLike
    });
  } catch (error) {
    next(error);
  }
};

// Delete a video
exports.deleteVideo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Find video
    const video = await Video.findById(id);
    
    if (!video) {
      return res.status(404).json({
        status: 'error',
        message: 'Video not found'
      });
    }
    
    // Check if user owns the video
    if (video.user.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only delete your own videos'
      });
    }
    
    // Delete video file
    const videoPath = path.join(__dirname, '..', video.videoUrl);
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }
    
    // Delete thumbnail if exists
    if (video.thumbnail) {
      const thumbnailPath = path.join(__dirname, '..', video.thumbnail);
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }
    }
    
    // Delete all likes for this video
    await Like.deleteMany({ video: id });
    
    // Delete all comments for this video
    await Comment.deleteMany({ video: id });
    
    // Delete the video document
    await Video.findByIdAndDelete(id);
    
    res.status(200).json({
      status: 'success',
      message: 'Video deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Search videos by caption or tags
exports.searchVideos = async (req, res, next) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        status: 'error',
        message: 'Search query is required'
      });
    }
    
    const videos = await Video.find({
      $or: [
        { caption: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ]
    })
    .sort({ views: -1 })
    .populate('user', 'username avatar');
    
    // If user is authenticated, check if they liked each video
    if (req.user) {
      const videoIds = videos.map(video => video._id);
      const likes = await Like.find({
        user: req.user._id,
        video: { $in: videoIds }
      });
      
      const likedVideoIds = likes.map(like => like.video.toString());
      
      // Add isLiked flag to each video
      videos.forEach(video => {
        video._doc.isLiked = likedVideoIds.includes(video._id.toString());
      });
    }
    
    res.status(200).json(videos);
  } catch (error) {
    next(error);
  }
};
