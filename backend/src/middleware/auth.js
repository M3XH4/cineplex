import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../utils/logger.js';

const getCookieValue = (cookieHeader, cookieName) => {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
  const match = cookies.find((cookie) => cookie.startsWith(`${cookieName}=`));
  if (!match) return null;

  return decodeURIComponent(match.slice(cookieName.length + 1));
};

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
    } catch (error) {
      logger.error('Bearer token parsing failed:', error);
    }
  }

  if (!token) {
    token = getCookieValue(req.headers.cookie, 'accessToken');
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cineplex_jwt_secret_key_123456');
      
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }
      
      next();
    } catch (error) {
      logger.error('Token authentication failed:', error);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user?.role || 'anonymous'}' is not authorized to access this route`,
      });
    }
    next();
  };
};
