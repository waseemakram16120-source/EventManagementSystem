const mongoose = require('mongoose');

// Try to connect to MongoDB. Never crashes the process: if there is no
// MONGODB_URI or the server is unreachable, the API falls back to the
// in-memory demo store (backend/lib/store.js) and keeps serving.
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('ℹ️  No MONGODB_URI set — running in demo mode (in-memory data).');
    return false;
  }
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`⚠️  MongoDB unreachable (${error.message}) — running in demo mode (in-memory data).`);
    return false;
  }
};

const isMongoConnected = () => mongoose.connection.readyState === 1;

module.exports = connectDB;
module.exports.isMongoConnected = isMongoConnected;
