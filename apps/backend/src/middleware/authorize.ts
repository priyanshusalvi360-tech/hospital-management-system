import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/ApiResponse';

type UserRole = 'ADMIN' | 'STAFF';

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ApiResponse.error(res, 'Unauthorized', 401);
      return;
    }
    if (!roles.includes(req.user.role as UserRole)) {
      ApiResponse.error(res, 'Forbidden: insufficient permissions', 403);
      return;
    }
    next();
  };
};
