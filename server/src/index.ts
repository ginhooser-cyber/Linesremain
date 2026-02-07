// ─── Lineremain Server Entry Point ───

import { config } from './config.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import rateLimit from 'express-rate-limit';
import { apiRouter } from './api/router.js';
import { authService } from './auth/AuthService.js';
import { logger } from './utils/logger.js';
import { setupGracefulShutdown } from './utils/gracefulShutdown.js';
import { gameLoop } from './game/GameLoop.js';
import { SocketServer } from './network/SocketServer.js';
import { StateBroadcaster } from './network/StateBroadcaster.js';
import { WorldSaver } from './world/WorldSaver.js';

// ─── Express App ───

const app = express();
app.set('trust proxy', 1);

// ─── Global Middleware ───

app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
  }),
);

app.use(helmet());

app.use(express.json({ limit: '1mb' }));

app.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please try again later.',
      },
    },
  }),
);

// ─── API Routes ───

app.use('/api', apiRouter);

// ─── HTTP Server ───

const httpServer = createServer(app);

// ─── Socket.IO Server ───

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.CORS_ORIGIN,
    methods: ['GET', 'POST'],
  },
});

// Socket.IO auth middleware — verify JWT from handshake
io.use((socket, next) => {
  const token = socket.handshake.auth['token'] as string | undefined;

  if (!token) {
    next(new Error('Authentication token is required'));
    return;
  }

  try {
    const payload = authService.verifyToken(token);
    socket.data['playerId'] = payload.playerId;
    socket.data['username'] = payload.username;
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
});

// ─── Initialize Game Systems ───

// 1. Initialize the game loop (creates world, registers all systems)
gameLoop.initialize();

// 2. Initialize the socket server (handles connections, player lifecycle, handlers)
const socketServer = new SocketServer(io);
socketServer.initialize();

// 3. Initialize state broadcaster (delta updates, player stats, world time)
const stateBroadcaster = new StateBroadcaster(socketServer);
stateBroadcaster.initialize();

// 4. Initialize world saver
const worldSaver = new WorldSaver();

// 5. Wire save callback into game loop
gameLoop.onSave(async () => {
  await socketServer.saveAllPlayers();
  await worldSaver.autoSave(gameLoop.world.chunkStore, [], []);
});

// 6. Start the game loop (20 ticks/sec)
gameLoop.start();

logger.info('Game systems initialized and running');

// ─── Graceful Shutdown ───

setupGracefulShutdown({
  httpServer,
  io,
  onSaveWorld: async () => {
    gameLoop.stop();
    await socketServer.shutdown();
    await worldSaver.autoSave(gameLoop.world.chunkStore, [], []);
  },
});

// ─── Start Server ───

httpServer.listen(config.PORT, () => {
  logger.info(
    {
      port: config.PORT,
      env: config.NODE_ENV,
      maxPlayers: config.MAX_PLAYERS,
      worldSize: config.WORLD_SIZE,
    },
    `Lineremain server listening on port ${config.PORT}`,
  );
});

export { app, httpServer, io };
