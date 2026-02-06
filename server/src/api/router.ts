// ─── API Router ───

import { Router } from 'express';
import { authRouter } from './routes/auth.routes.js';
import { serverRouter } from './routes/server.routes.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/server', serverRouter);

export const apiRouter = router;