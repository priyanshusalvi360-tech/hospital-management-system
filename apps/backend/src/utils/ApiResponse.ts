import { Response } from 'express';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export class ApiResponse {
  static success<T>(
    res: Response,
    data: T,
    message = 'Success',
    statusCode = 200,
    meta?: PaginationMeta
  ) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      ...(meta && { meta }),
    });
  }

  static error(res: Response, message: string, statusCode = 500, errors?: unknown) {
    return res.status(statusCode).json({
      success: false,
      message,
      ...(errors !== undefined && { errors: errors as Record<string, unknown> }),
    });
  }
}
