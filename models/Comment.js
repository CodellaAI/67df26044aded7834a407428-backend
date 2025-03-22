
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  video: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    maxlength: [300, 'Comment cannot be more than 300 characters']
  },
  likes: {
    type: Number,
    default: 0
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for efficient querying
commentSchema.index({ video: 1, createdAt: -1 });
commentSchema.index({ parent: 1 });

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
