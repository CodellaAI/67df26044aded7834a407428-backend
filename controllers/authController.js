
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { user: { _id: user._id, username: user.username, email: user.email } },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Register a new user
exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email or username already exists'
      });
    }
    
    // Create new user
    const user = await User.create({
      username,
      email,
      password
    });
    
    // Generate token
    const token = generateToken(user);
    
    // Remove password from response
    user.password = undefined;
    
    res.status(201).json({
      status: 'success',
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }
    
    // Find user by email and include password
    const user = await User.findOne({ email }).select('+password');
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }
    
    // Check if password is correct
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }
    
    // Generate token
    const token = generateToken(user);
    
    // Remove password from response
    user.password = undefined;
    
    res.status(200).json({
      status: 'success',
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      user
    });
  } catch (error) {
    next(error);
  }
};
