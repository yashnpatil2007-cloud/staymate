const mongoose = require('mongoose');
const env = require('./env');

let memoryServer = null;

async function connectDatabase() {
  mongoose.set('strictQuery', true);

  if (env.mongoUri) {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 15000 });
    console.log('MongoDB connected');
    return { mode: 'mongodb' };
  }

  // If no MONGODB_URI is provided, fallback to in-memory MongoDB so the server starts without crashing
  const { MongoMemoryServer } = require('mongodb-memory-server');
  console.log('No MONGODB_URI set - starting in-memory MongoDB...');
  memoryServer = await MongoMemoryServer.create();
  const uri = memoryServer.getUri();
  await mongoose.connect(uri);
  console.log('In-memory MongoDB connected (data resets when the server stops)');
  return { mode: 'memory' };
}

async function disconnectDatabase() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}

module.exports = { connectDatabase, disconnectDatabase };
