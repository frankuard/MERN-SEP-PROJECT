const dns = require('dns');

dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');

let isDbConnected = false;

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.warn('MongoDB connection skipped: MONGO_URI is not set.');
    return;
  }

  try {
    console.log('Connecting to MongoDB...');

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      family: 4,
      serverSelectionTimeoutMS: 15000,
    });

    isDbConnected = true;

    console.log(
      `MongoDB connected: ${conn.connection.host}/${conn.connection.name}`
    );
  } catch (err) {
    isDbConnected = false;

    console.warn('MongoDB connection failed:', err.message);
    console.warn('Server will continue running. Auth routes require MongoDB.');
  }
};

const getDbStatus = () => ({
  connected:
    isDbConnected && mongoose.connection.readyState === 1,
  readyState: mongoose.connection.readyState,
});

module.exports = connectDB;
module.exports.getDbStatus = getDbStatus;