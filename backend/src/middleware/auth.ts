import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

interface JwtPayload {
  userId: string;
  role: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authGuard = async (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError(401, 'Authorization token missing or malformed', 'AUTH_001'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const accessSecret = process.env.JWT_ACCESS_SECRET || 'megamart_jwt_access_secret_super_secure_key_2026';
    const decoded = jwt.verify(token, accessSecret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError(401, 'Access token has expired', 'AUTH_002'));
    }
    return next(new AppError(401, 'Invalid or malformed authorization token', 'AUTH_001'));
  }
};

export const requireRole = (roles: Array<'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN'>) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required', 'AUTH_001'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'You do not have permission to access this resource', 'AUTH_006'));
    }

    next();
  };
};
