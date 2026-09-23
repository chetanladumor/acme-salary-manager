import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { loginSchema } from './auth.schema';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedInput = loginSchema.parse(req.body);
      const result = await AuthService.login(validatedInput);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid login request payload',
            details: err.errors,
          },
        });
        return;
      }
      next(err);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Not authenticated',
          },
        });
        return;
      }

      const user = await AuthService.getUserById(req.user.id);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }

  static async logout(_req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      message: 'Successfully logged out',
    });
  }
}
