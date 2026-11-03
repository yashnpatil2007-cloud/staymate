const env = require('./config/env');
const app = require('./app');
const { connectDatabase, disconnectDatabase } = require('./config/db');
const { seedDatabase } = require('./seed');

async function start() {
  try {
    const { mode } = await connectDatabase();

    const User = require('./models/User');
    const userCount = await User.countDocuments();
    if (userCount === 0 && env.seedDemo) {
      console.log('Empty database detected - seeding demo content...');
      await seedDatabase();
    }

    if (mode === 'memory') {
      console.log('Development database is in-memory. Set MONGODB_URI in server/.env for persistence.');
    }

    const server = app.listen(env.port, () => {
      console.log(`StayMate API running on http://localhost:${env.port}`);
      console.log(`Allowed frontend origin: ${env.clientUrl}`);
    });

    const shutdown = async (signal) => {
      console.log(`\n${signal} received, shutting down...`);
      server.close(async () => {
        await disconnectDatabase();
        process.exit(0);
      });
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
