import jwt from 'jsonwebtoken';

export const generateAccessToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'cineplex_jwt_secret_key_123456_super_secret',
    { expiresIn: process.env.JWT_EXPIRE || '1d' }
  );
};

export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || 'cineplex_jwt_refresh_secret_key_987654_super_secret',
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
};
