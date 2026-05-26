import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../types';

export function success<T>(res: Response, data: T, message?: string, statusCode = 200): Response {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
}

export function error(res: Response, message: string, statusCode = 500): Response {
  const response: ApiResponse = {
    success: false,
    error: message,
  };
  return res.status(statusCode).json(response);
}

export function paginated<T>(
  res: Response,
  data: T,
  total: number,
  page: number,
  limit: number
): Response {
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
  return res.status(200).json(response);
}
