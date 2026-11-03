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

  if (env.isProduction) {
    throw new Error('MONGODB_URI is required in production.');
  }

  const { MongoMemoryServer } = require('mongodb-memory-server');
  console.log('No MONGODB_URI set - starting in-memory MongoDB for development...');
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
