
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configure storage for videos
const videoStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/videos');
  },
  filename: function(req, file, cb) {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// Configure storage for avatars
const avatarStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/avatars');
  },
  filename: function(req, file, cb) {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// Filter for video files
const videoFilter = (req, file, cb) => {
  const allowedTypes = /mp4|mov|webm|avi|mkv/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype.startsWith('video/');
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only video files are allowed!'), false);
  }
};

// Filter for image files (avatars)
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype.startsWith('image/');
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Create multer instances
const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max file size
  }
});

const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'error',
        message: 'File is too large'
      });
    }
    return res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
  
  if (err) {
    return res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
  
  next();
};

module.exports = {
  uploadVideo: uploadVideo.single('video'),
  uploadAvatar: uploadAvatar.single('avatar'),
  handleMulterError
};
