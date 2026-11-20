const mongoose = require('mongoose');
const env = require('./env');

mongoose.set('strictQuery', true);

async function connectDB() {
  if (!env.MONGO_URI || env.MONGO_URI.includes('<username>')) {
    console.warn('⚠  MONGO_URI is still a placeholder — set it in backend/.env');
  }
  await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  console.log(`✓ MongoDB connected (${mongoose.connection.name})`);
}

module.exports = connectDB;
