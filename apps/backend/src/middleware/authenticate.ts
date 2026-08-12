import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Access token required');
    }
    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);
    req.user = {
      userId: payload.userId,
      username: payload.username,
      role: payload.role as any,
    };
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      ApiResponse.error(res, 'Access token expired', 401);
    } else if (error.name === 'JsonWebTokenError') {
      ApiResponse.error(res, 'Invalid access token', 401);
    } else {
      next(error);
    }
  }
};
