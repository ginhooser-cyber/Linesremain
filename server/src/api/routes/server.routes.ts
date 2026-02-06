// ─── Server Routes ───

import { Router } from 'express';
import { config } from '../../config.js';

const router = Router();

// ─── GET /info ───

router.get('/info', (_req, res) => {
  res.status(200).json({
    name: 'Lineremain',
    version: '1.0.0',
    maxPlayers: config.MAX_PLAYERS,
    currentPlayers: 0, // TODO: Track connected players
    mapSize: config.WORLD_SIZE,
  });
});

// ─── GET /status ───

router.get('/status', (_req, res) => {
  res.status(200).json({
    online: true,
    playerCount: 0, // TODO: Track connected players
    uptime: process.uptime(),
  });
});

export const serverRouter = router;