const mongoose = require('mongoose');

/**
 * connectDB
 * Attempts to connect to MongoDB. On failure it logs the error but DOES NOT
 * exit the process so the server can continue running for local frontend/dev
 * work (API stubs will still respond).
 *
 * Inputs: reads process.env.MONGO_URI
 * Outputs: logs success or error. Returns the mongoose connection promise if available.
 */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
    return mongoose.connection;
  } catch (error) {
    // Log the error but don't terminate the process — helpful for local dev when
    // MongoDB isn't installed or running.
    console.error('MongoDB connection error:', error.message);
    console.warn('Continuing without MongoDB. Some features may be disabled.');
    return null;
  }
};

module.exports = connectDB;
