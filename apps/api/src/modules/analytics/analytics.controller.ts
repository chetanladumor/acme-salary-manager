import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service';

export class AnalyticsController {
  static async getOverview(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const overview = await AnalyticsService.getOverview();

      res.status(200).json({
        success: true,
        data: overview,
      });
    } catch (err) {
      next(err);
    }
  }
}
