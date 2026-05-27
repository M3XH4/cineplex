import http from 'http';
import dotenv from 'dotenv';
import app from './src/app.js';
import connectDB from './src/config/db.js';
import { initSocket } from './src/config/socket.js';
import logger from './src/utils/logger.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

let server;

const startServer = async () => {
  await connectDB();

  // Create HTTP Server after DB connection is ready
  server = http.createServer(app);

  // Initialize Socket.io
  initSocket(server);

  server.listen(PORT, () => {
    logger.info(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer().catch((error) => {
  logger.error(`Server startup failed: ${error.message}`, error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection Error: ${err.message}`, err);
  // Close server & exit process
  if (server) {
    server.close(() => process.exit(1));
    return;
  }

  process.exit(1);
});
