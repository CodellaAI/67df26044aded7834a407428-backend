
const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  video: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    default: null
  },
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  }
}, {
  timestamps: true
});

// Ensure a user can only like a video or comment once
likeSchema.index({ user: 1, video: 1 }, { unique: true, sparse: true });
likeSchema.index({ user: 1, comment: 1 }, { unique: true, sparse: true });

const Like = mongoose.model('Like', likeSchema);

module.exports = Like;
