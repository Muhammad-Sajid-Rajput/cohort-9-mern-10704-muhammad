import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    logger.info('db connected');
  } catch (error) {
    logger.error('db connection failed', error);
    process.exit(1);
  }
};

export const disconnectDb = async () => {
  try {
    await mongoose.disconnect();
    logger.info('db disconnected');
  } catch (error) {
    logger.error('db disconnect failed', error);
    process.exit(1);
  }
};
