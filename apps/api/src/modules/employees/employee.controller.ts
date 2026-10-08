import { Request, Response, NextFunction } from 'express';
import { EmployeeService } from './employee.service';
import { employeeQuerySchema } from './employee.schema';

export class EmployeeController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedQuery = employeeQuerySchema.parse(req.query);
      const result = await EmployeeService.listEmployees(validatedQuery);

      res.status(200).json({
        success: true,
        data: result.employees,
        pagination: result.pagination,
      });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: err.errors,
          },
        });
        return;
      }
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const employee = await EmployeeService.getEmployeeById(id);

      res.status(200).json({
        success: true,
        data: employee,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getFacets(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const facets = await EmployeeService.getFilterFacets();

      res.status(200).json({
        success: true,
        data: facets,
      });
    } catch (err) {
      next(err);
    }
  }

  static async exportEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedQuery = employeeQuerySchema.parse(req.query);
      const employees = await EmployeeService.exportEmployee(validatedQuery);
      res.status(200).json({
        success: true,
        data: employees,
      });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: err.errors,
          },
        });
        return;
      }
      next(err);
    }
  }

  // =========================================================================
  // BACKEND-GENERATED CSV STREAM (FOR LARGE DATASETS: 100k - 1M+ ROWS)
  // Directly streams RFC-4180 CSV rows into Express HTTP response.
  // Avoids JSON serialization and buffering to prevent memory exhaustion.
  // =========================================================================
  static async exportCsvStream(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedQuery = employeeQuerySchema.parse(req.query);
      const filename = `employees_stream_${new Date().toISOString().slice(0, 10)}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');

      await EmployeeService.streamExportEmployeesCsv(validatedQuery, res);
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: err.errors,
          },
        });
        return;
      }
      next(err);
    }
  }

}
