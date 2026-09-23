import { Router } from 'express';
import { AuthController } from './auth.controller';
import { requireAuth } from '../../middleware/auth.middleware';

export const authRouter = Router();

authRouter.post('/login', AuthController.login);
authRouter.get('/me', requireAuth, AuthController.me);
authRouter.post('/logout', AuthController.logout);
