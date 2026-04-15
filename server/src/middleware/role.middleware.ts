import { Response, NextFunction, RequestHandler } from 'express';
import { Role } from '@prisma/client';
import { AuthRequest } from './auth.middleware';

export function requireRole(...roles: Role[]): RequestHandler {
  return (req, res: Response, next: NextFunction): void => {
    const user = (req as AuthRequest).user;
    if (!user || !roles.includes(user.role)) {
      res.status(403).json({ message: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
