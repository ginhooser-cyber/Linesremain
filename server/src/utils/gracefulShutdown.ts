// ─── Graceful Shutdown ───

import { closeDatabase } from '../database/connection.js';
import { logger } from './logger.js';

let isShuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`Received ${signal}. Shutting down gracefully...`);

  try {
    // Close database connections
    await closeDatabase();
    logger.info('Database connections closed');

    // TODO: Save world state
    // TODO: Disconnect all players
    // TODO: Close Redis connection

    logger.info('Shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error(error, 'Error during shutdown');
    process.exit(1);
  }
}

export function setupGracefulShutdown(): void {
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}