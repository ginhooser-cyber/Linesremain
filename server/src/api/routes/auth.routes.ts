// ─── Auth Routes ───

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authService, AuthError } from '../../auth/AuthService.js';
import { authenticateRequest } from '../../auth/middleware.js';
import {
  RegisterSchema,
  LoginSchema,
  RefreshSchema,
} from '../validators/auth.validators.js';
import { logger } from '../../utils/logger.js';

const router = Router();

// ─── Rate Limiters ───

const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many attempts. Please try again later.',
    },
  },
});

// ─── Helpers ───

function handleAuthError(error: unknown, res: import('express').Response): void {
  if (error instanceof AuthError) {
    res.status(error.statusCode).json({
      error: { code: error.code, message: error.message },
    });
    return;
  }

  logger.error(error, 'Unexpected auth error');
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
  });
}

// ─── POST /register ───

router.post('/register', authRateLimiter, async (req, res) => {
  try {
    const validation = RegisterSchema.safeParse(req.body);
    if (!validation.success) {
      const firstError = validation.error.errors[0]!;
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: firstError.message },
      });
      return;
    }

    const { username, email, password } = validation.data;
    const result = await authService.register(username, email, password);

    res.status(201).json(result);
  } catch (error) {
    handleAuthError(error, res);
  }
});

// ─── POST /login ───

router.post('/login', authRateLimiter, async (req, res) => {
  try {
    const validation = LoginSchema.safeParse(req.body);
    if (!validation.success) {
      const firstError = validation.error.errors[0]!;
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: firstError.message },
      });
      return;
    }

    const { email, password } = validation.data;
    const result = await authService.login(email, password);

    res.status(200).json(result);
  } catch (error) {
    handleAuthError(error, res);
  }
});

// ─── POST /refresh ───

router.post('/refresh', async (req, res) => {
  try {
    const validation = RefreshSchema.safeParse(req.body);
    if (!validation.success) {
      const firstError = validation.error.errors[0]!;
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: firstError.message },
      });
      return;
    }

    const { refreshToken } = validation.data;
    const tokens = await authService.refreshTokens(refreshToken);

    res.status(200).json(tokens);
  } catch (error) {
    handleAuthError(error, res);
  }
});

// ─── POST /logout ───

router.post('/logout', authenticateRequest, async (req, res) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };

    if (!refreshToken) {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Refresh token is required' },
      });
      return;
    }

    await authService.logout(refreshToken);

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    handleAuthError(error, res);
  }
});

export const authRouter = router;