import { createApp } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { ENV } from './config/env.js';
import { seedDatabase } from './seed/seedData.js';

const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed initial admin and demo data if needed
    try {
      await seedDatabase();
    } catch (seedErr) {
      console.warn('[Server] Auto-seeding skipped or encountered non-fatal notice:', seedErr);
    }

    const app = createApp();

    const server = app.listen(ENV.PORT, () => {
      console.log(`=========================================`);
      console.log(`  DOCTOR TRACKER BACKEND API RUNNING    `);
      console.log(`  Environment: ${ENV.NODE_ENV}           `);
      console.log(`  Port:        ${ENV.PORT}               `);
      console.log(`  Base URL:    http://localhost:${ENV.PORT}/api`);
      console.log(`=========================================`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal: string) => {
      console.log(`\n[Server] Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        await disconnectDB();
        console.log('[Server] Database disconnected and process exited.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('[Server] Fatal error during startup:', error);
    process.exit(1);
  }
};

startServer();

