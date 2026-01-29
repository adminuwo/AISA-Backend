import mongoose from 'mongoose';
import { MONGO_URI } from './env.js';
import logger from '../utils/logger.js';

import dns from 'dns';

// Fix for querySrv ECONNREFUSED on some networks/Windows
dns.setServers(['8.8.8.8', '8.8.4.4']);

console.log("MONGO_URI", MONGO_URI);
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Error: ${error.message}`);
    // Fallback info if still failing
    if (error.message.includes('ECONNREFUSED')) {
      logger.info("DNS resolution failed. This is often a local network/ISP issue with SRV records.");
    }
  }
};

export default connectDB;
