import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { requireAuth } from '../../middleware/auth.middleware';

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth);

analyticsRouter.get('/overview', AnalyticsController.getOverview);
