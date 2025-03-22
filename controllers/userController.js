
const User = require('../models/User');
const Follow = require('../models/Follow');
const Video = require('../models/Video');
const fs = require('fs-extra');
const path = require('path');

// Get user by username
exports.getUserByUsername = async (req, res, next) => {
  try {
    const { username } = req.params;
    
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// Get user by ID
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// Update user profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { bio } = req.body;
    
    // Find user
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Update user fields
    if (bio !== undefined) {
      user.bio = bio;
    }
    
    // If avatar was uploaded, update avatar field
    if (req.file) {
      // Delete old avatar if exists
      if (user.avatar && !user.avatar.includes('placehold.co')) {
        const oldAvatarPath = path.join(__dirname, '..', user.avatar);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }
      
      user.avatar = `/uploads/avatars/${req.file.filename}`;
    }
    
    await user.save();
    
    res.status(200).json({
      status: 'success',
      user
    });
  } catch (error) {
    next(error);
  }
};

// Follow a user
exports.followUser = async (req, res, next) => {
  try {
    const { id } = req.params; // ID of user to follow
    const currentUserId = req.user._id;
    
    // Check if trying to follow self
    if (id === currentUserId.toString()) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot follow yourself'
      });
    }
    
    // Check if user to follow exists
    const userToFollow = await User.findById(id);
    
    if (!userToFollow) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Check if already following
    const existingFollow = await Follow.findOne({
      follower: currentUserId,
      following: id
    });
    
    if (existingFollow) {
      return res.status(400).json({
        status: 'error',
        message: 'You are already following this user'
      });
    }
    
    // Create follow relationship
    await Follow.create({
      follower: currentUserId,
      following: id
    });
    
    // Update follower and following counts
    await User.findByIdAndUpdate(id, { $inc: { followers: 1 } });
    await User.findByIdAndUpdate(currentUserId, { $inc: { following: 1 } });
    
    res.status(200).json({
      status: 'success',
      message: 'Successfully followed user'
    });
  } catch (error) {
    next(error);
  }
};

// Unfollow a user
exports.unfollowUser = async (req, res, next) => {
  try {
    const { id } = req.params; // ID of user to unfollow
    const currentUserId = req.user._id;
    
    // Check if trying to unfollow self
    if (id === currentUserId.toString()) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot unfollow yourself'
      });
    }
    
    // Check if user to unfollow exists
    const userToUnfollow = await User.findById(id);
    
    if (!userToUnfollow) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Check if actually following
    const existingFollow = await Follow.findOne({
      follower: currentUserId,
      following: id
    });
    
    if (!existingFollow) {
      return res.status(400).json({
        status: 'error',
        message: 'You are not following this user'
      });
    }
    
    // Remove follow relationship
    await Follow.findOneAndDelete({
      follower: currentUserId,
      following: id
    });
    
    // Update follower and following counts
    await User.findByIdAndUpdate(id, { $inc: { followers: -1 } });
    await User.findByIdAndUpdate(currentUserId, { $inc: { following: -1 } });
    
    res.status(200).json({
      status: 'success',
      message: 'Successfully unfollowed user'
    });
  } catch (error) {
    next(error);
  }
};

// Check if following a user
exports.checkFollow = async (req, res, next) => {
  try {
    const { id } = req.params; // ID of user to check
    const currentUserId = req.user._id;
    
    // Check if following
    const existingFollow = await Follow.findOne({
      follower: currentUserId,
      following: id
    });
    
    res.status(200).json({
      status: 'success',
      isFollowing: !!existingFollow
    });
  } catch (error) {
    next(error);
  }
};

// Get user's followers
exports.getFollowers = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const followers = await Follow.find({ following: id })
      .populate('follower', 'username avatar bio');
    
    res.status(200).json({
      status: 'success',
      followers: followers.map(follow => follow.follower)
    });
  } catch (error) {
    next(error);
  }
};

// Get users followed by a user
exports.getFollowing = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const following = await Follow.find({ follower: id })
      .populate('following', 'username avatar bio');
    
    res.status(200).json({
      status: 'success',
      following: following.map(follow => follow.following)
    });
  } catch (error) {
    next(error);
  }
};

// Get suggested users (not followed by current user)
exports.getSuggestedUsers = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    
    // Get IDs of users already followed
    const followedUsers = await Follow.find({ follower: currentUserId })
      .select('following');
    
    const followedUserIds = followedUsers.map(follow => follow.following);
    
    // Add current user ID to exclude from results
    followedUserIds.push(currentUserId);
    
    // Find users not in the followed list, limit to 10
    const suggestedUsers = await User.find({
      _id: { $nin: followedUserIds }
    })
    .select('username avatar bio followers')
    .sort({ followers: -1 })
    .limit(10);
    
    res.status(200).json({
      status: 'success',
      users: suggestedUsers
    });
  } catch (error) {
    next(error);
  }
};

// Search users
exports.searchUsers = async (req, res, next) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        status: 'error',
        message: 'Search query is required'
      });
    }
    
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { bio: { $regex: query, $options: 'i' } }
      ]
    })
    .select('username avatar bio followers')
    .limit(20);
    
    res.status(200).json({
      status: 'success',
      users
    });
  } catch (error) {
    next(error);
  }
};
