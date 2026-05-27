import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes.js';
import movieRoutes from './routes/movieRoutes.js';
import showtimeRoutes from './routes/showtimeRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';
import cinemaRoutes from './routes/cinemaRoutes.js';

import errorHandler from './middleware/errorHandler.js';

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Security Headers
app.use(helmet());

// Cross-Origin Resource Sharing
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Parsers
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});

app.use('/api', apiLimiter);

// Rate Limiting (Brute-force protection for Auth routes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.'
  }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// API Route Mappings
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/showtimes', showtimeRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/cinemas', cinemaRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, status: 'Healthy', timestamp: new Date() });
});

app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'CinePlex API is running' });
});

// Central Error Handler Middleware
app.use(errorHandler);

export default app;
