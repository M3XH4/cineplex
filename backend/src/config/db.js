import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const connectDB = async () => {
  try {
    const connUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cineplex';
    logger.info('Connecting to MongoDB');
    
    const conn = await mongoose.connect(connUri);
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
