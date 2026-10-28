import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse.js';
import { ENV } from '../config/env.js';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (ENV.NODE_ENV !== 'test') {
    console.error('[Error Middleware]:', err);
  }

  // 1. Mongoose duplicate key error (e.g. unique email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    sendError(res, `A record with this ${field} already exists.`, 409, {
      field,
      value: err.keyValue ? err.keyValue[field] : undefined,
    });
    return;
  }

  // 2. Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e: any) => ({
      field: e.path,
      message: e.message,
    }));
    sendError(res, 'Validation failed', 400, errors);
    return;
  }

  // 3. Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    sendError(res, `Invalid format for resource identifier (${err.path})`, 400);
    return;
  }

  // 4. Prevent Information Disclosure in Production
  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500 && ENV.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please contact system support.'
      : err.message || 'Internal server error';

  sendError(res, message, statusCode);
};
