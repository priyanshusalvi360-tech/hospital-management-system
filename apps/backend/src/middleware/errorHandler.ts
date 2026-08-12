import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(`[${new Date().toISOString()}] ${error.stack}`);

  if (error instanceof ApiError) {
    ApiResponse.error(res, error.message, error.statusCode);
    return;
  }

  // Prisma unique constraint violation
  if ((error as any).code === 'P2002') {
    ApiResponse.error(res, 'Record already exists with that value', 409);
    return;
  }

  // Prisma record not found
  if ((error as any).code === 'P2025') {
    ApiResponse.error(res, 'Record not found', 404);
    return;
  }

  ApiResponse.error(res, 'Internal server error', 500);
};
