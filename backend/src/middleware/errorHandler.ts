import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  public code: string;
  constructor(public statusCode: number, public message: string, code = 'SYSTEM_ERROR', public details: any[] = []) {
    super(message);
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'SYSTEM_ERROR';
  const details = err.details || [];

  // Log error in development
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[Error] ${req.method} ${req.url} - Status: ${statusCode} - Code: ${code} - Msg: ${message}`, err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
};
