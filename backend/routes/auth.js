const express = require('express');
const jwt = require('jsonwebtoken');
const data = require('../lib/data');
const { protect } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { registerValidation, loginValidation } = require('../middleware/validate');

const router = express.Router();

// Generate JWT Token (7 days)
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'eventflow-dev-secret', { expiresIn: '7d' });
};

const authResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  token: generateToken(user._id),
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerValidation, asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await data.findUserByEmail(email);
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists with this email' });
  }

  const user = await data.createUser({ name, email, password });
  res.status(201).json(authResponse(user));
}));

// @route   POST /api/auth/login
// @desc    Login user & get token
// @access  Public
router.post('/login', loginValidation, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await data.findUserByEmail(email, true);
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const isMatch = await data.comparePassword(user, password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  res.json(authResponse(user));
}));

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, asyncHandler(async (req, res) => {
  const user = await data.getUserProfile(req.user._id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  delete user.password;
  res.json(user);
}));

module.exports = router;
