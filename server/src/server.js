const env = require('./config/env');
const app = require('./app');
const { connectDatabase, disconnectDatabase } = require('./config/db');
const { seedDatabase } = require('./seed');

async function start() {
  const server = app.listen(env.port, () => {
    console.log(`StayMate API running on port ${env.port}`);
    console.log(`Allowed frontend origin: ${env.clientUrl}`);
  });

  try {
    const { mode } = await connectDatabase();

    const User = require('./models/User');
    const userCount = await User.countDocuments();
    if (userCount === 0 && env.seedDemo) {
      console.log('Empty database detected - seeding demo content...');
      await seedDatabase();
    }

    if (mode === 'memory') {
      console.log('Database is in-memory. Set MONGODB_URI for persistence.');
    }
  } catch (error) {
    console.error('Database connection/initialization error:', error);
  }

  const shutdown = async (signal) => {
    console.log(`\n${signal} received, shutting down...`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();
