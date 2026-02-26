const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MongoDB connection error: MONGO_URI is not set in .env');
    process.exit(1);
  }
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      ssl: true,
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    if (err.reason) console.error('Reason:', err.reason);
    throw err;
  }
};

module.exports = connectDB;