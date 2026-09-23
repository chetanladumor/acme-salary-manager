import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { authRouter } from './modules/auth/auth.routes';
import { employeeRouter } from './modules/employees/employee.routes';
import { analyticsRouter } from './modules/analytics/analytics.routes';

export const app = express();

// Security and utility middleware
app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());

if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'acme-salary-api',
    environment: env.NODE_ENV,
  });
});

// Mount module routes
app.use('/api/auth', authRouter);
app.use('/api/employees', employeeRouter);
app.use('/api/analytics', analyticsRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
    },
  });
});

// Centralized error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';

  if (statusCode >= 500) {
    console.error('[API Error]:', err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: statusCode >= 500 && env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
      ...(err.details && { details: err.details }),
    },
  });
});
