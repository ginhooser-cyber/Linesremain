// ─── Auth Middleware ───

import type { Request, Response, NextFunction } from 'express';
import { authService } from './AuthService.js';
import type { JwtPayload } from './AuthService.js';

// Extend Express Request type to include auth payload
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
declare module 'express-serve-static-core' {
  interface Request {
    player?: JwtPayload;
  }
}

/**
 * Express middleware that verifies the JWT Bearer token
 * and attaches { playerId, username } to req.player.
 */
export function authenticateRequest(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: {
        code: 'MISSING_TOKEN',
        message: 'Authorization header with Bearer token is required',
      },
    });
    return;
  }

  const token = authHeader.slice(7); // Remove "Bearer "

  try {
    const payload = authService.verifyToken(token);
    req.player = payload;
    next();
  } catch {
    res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token',
      },
    });
  }
}