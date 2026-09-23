import { Request, Response, NextFunction } from 'express';
import { SalaryService } from './salary.service';
import { salaryAdjustmentSchema } from './salary.schema';

export class SalaryController {
  static async adjust(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validatedInput = salaryAdjustmentSchema.parse(req.body);
      const performedByEmail = req.user?.email || 'system@acme.corp';

      const result = await SalaryService.adjustSalary(id, validatedInput, performedByEmail);

      res.status(201).json({
        success: true,
        message: 'Compensation successfully adjusted',
        data: result,
      });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid salary adjustment payload',
            details: err.errors,
          },
        });
        return;
      }
      next(err);
    }
  }

  static async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const history = await SalaryService.getSalaryHistory(id);

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (err) {
      next(err);
    }
  }
}
