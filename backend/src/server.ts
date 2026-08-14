import dotenv from 'dotenv';
// Load environment variables before importing other modules
dotenv.config();

import app from './app';
import prisma from './config/db';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[Server] MegaMart API running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Clean server shutdown hooks
const shutdown = async (signal: string) => {
  console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);
  
  server.close(async () => {
    console.log('[Server] HTTP server closed.');
    try {
      await prisma.$disconnect();
      console.log('[Server] Database connection closed.');
      process.exit(0);
    } catch (err) {
      console.error('[Server] Error disconnecting from database:', err);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
