import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { APIError, ErrorCode } from '../types';

// Custom error class
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(code: ErrorCode, message: string, statusCode = 500, details?: any) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    
    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error response helper
export const createErrorResponse = (
  code: ErrorCode,
  message: string,
  details?: any
): APIError => ({
  code,
  message,
  details,
  timestamp: new Date().toISOString(),
});

// Common error creators
export const createNotFoundError = (resource: string, id?: string): AppError => {
  const message = id 
    ? `${resource} with ID '${id}' not found`
    : `${resource} not found`;
  
  return new AppError(ErrorCode.NOT_FOUND, message, 404);
};

export const createValidationError = (message: string, details?: any): AppError => {
  return new AppError(ErrorCode.BAD_REQUEST, message, 400, details);
};

export const createDatabaseError = (message: string, details?: any): AppError => {
  return new AppError(ErrorCode.DATABASE_ERROR, message, 500, details);
};

export const createVectorDbError = (message: string, details?: any): AppError => {
  return new AppError(ErrorCode.VECTOR_DB_ERROR, message, 500, details);
};

export const createAIServiceError = (message: string, details?: any): AppError => {
  return new AppError(ErrorCode.AI_SERVICE_ERROR, message, 500, details);
};

// Express error handler middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
  });

  // Handle different error types
  if (error instanceof AppError) {
    // Our custom application errors
    res.status(error.statusCode).json(
      createErrorResponse(error.code, error.message, error.details)
    );
    return;
  }

  if (error instanceof ZodError) {
    // Zod validation errors
    const validationErrors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));

    res.status(400).json(
      createErrorResponse(
        ErrorCode.BAD_REQUEST,
        'Validation failed',
        { validationErrors }
      )
    );
    return;
  }

  // Handle specific known errors
  if (error.name === 'SyntaxError' && 'body' in error) {
    res.status(400).json(
      createErrorResponse(ErrorCode.BAD_REQUEST, 'Invalid JSON in request body')
    );
    return;
  }

  if (error.message?.includes('rate limit')) {
    res.status(429).json(
      createErrorResponse(ErrorCode.RATE_LIMITED, 'Too many requests')
    );
    return;
  }

  // Default server error
  res.status(500).json(
    createErrorResponse(
      ErrorCode.INTERNAL_ERROR,
      'Internal server error',
      process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack,
      } : undefined
    )
  );
};

// Async error handler wrapper
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json(
    createErrorResponse(
      ErrorCode.NOT_FOUND,
      `Route ${req.method} ${req.path} not found`
    )
  );
};

// Validation error helper
export const handleValidationError = (error: any): never => {
  if (error instanceof ZodError) {
    const details = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    
    throw createValidationError('Validation failed', details);
  }
  
  throw createValidationError(error.message || 'Invalid input');
}; 