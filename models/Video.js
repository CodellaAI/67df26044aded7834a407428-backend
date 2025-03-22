
const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  videoUrl: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    default: ''
  },
  caption: {
    type: String,
    required: true,
    maxlength: [150, 'Caption cannot be more than 150 characters']
  },
  tags: {
    type: [String],
    default: []
  },
  sound: {
    type: String,
    default: 'Original Sound'
  },
  likes: {
    type: Number,
    default: 0
  },
  comments: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for efficient querying
videoSchema.index({ user: 1, createdAt: -1 });
videoSchema.index({ tags: 1 });

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;
