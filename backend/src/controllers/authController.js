import User from '../models/User.js';
import { generateAccessToken, generateRefreshToken } from '../utils/token.js';
import logger from '../utils/logger.js';
import jwt from 'jsonwebtoken';
import { clearAuthCookies, getCookieValue, setAuthCookies } from '../utils/cookies.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Determine role (protect staff/admin roles so ordinary registrations are customer only)
    let assignedRole = 'customer';
    if (role && ['staff', 'admin'].includes(role)) {
      // For bootstrapping purposes, if no users exist in database, allow first user to be admin
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        assignedRole = role;
      } else {
        // Otherwise, registrations default to customer, or requires admin auth (which we will handle separately)
        assignedRole = 'customer';
      }
    }

    const user = await User.create({
      name,
      email,
      password,
      role: assignedRole,
    });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to db
    user.refreshToken = refreshToken;
    await user.save();

    setAuthCookies(res, accessToken, refreshToken);

    res.status(201).json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Find user and select password hash
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    setAuthCookies(res, accessToken, refreshToken);

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Google OAuth Mock Login
// @route   POST /api/auth/google
// @access  Public
export const googleLogin = async (req, res, next) => {
  try {
    const { email, name, avatar, googleId } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Google auth requires an email' });
    }

    let user = await User.findOne({ email });

    if (!user) {
      // Create user if not found. Password is dummy since they use OAuth.
      const dummyPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        password: dummyPassword,
        avatar: avatar || '',
        isVerified: true,
      });
      logger.info(`New user registered via Google OAuth: ${email}`);
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    setAuthCookies(res, accessToken, refreshToken);

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh Token
// @route   POST /api/auth/refresh
// @access  Public
export const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.body.refreshToken || getCookieValue(req.headers.cookie, 'refreshToken');

    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'cineplex_jwt_refresh_secret_key_987654_super_secret');
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    setAuthCookies(res, newAccessToken, newRefreshToken);

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.refreshToken = undefined;
      await user.save();
    }

    clearAuthCookies(res);
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user details
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user profile preferences
// @route   PUT /api/auth/me
// @access  Private
export const updateMe = async (req, res, next) => {
  try {
    const allowedFields = {};
    const { name, avatar, preferences } = req.body;

    if (name) allowedFields.name = name;
    if (avatar !== undefined) allowedFields.avatar = avatar;
    if (preferences) allowedFields.preferences = preferences;

    const user = await User.findByIdAndUpdate(req.user.id, allowedFields, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};
