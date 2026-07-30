// middleware/errorHandle.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../domain/error/employeeErrors'; 
import { StatusCode } from '../shared/enums/statusCode';

export const errorHandler = (
  err: Error | AppError, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  console.error('Error:', err);

  // Handle custom application errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  // Handle MongoDB duplicate key error
  if (
    typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    (err as { name?: string }).name === 'MongoError' &&
    'code' in err &&
    (err as { code?: number }).code === 11000
  ) {
    return res.status(409).json({
      success: false,
      message: "An employee with this email already exists"
    });
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    return res.status(StatusCode.BAD_REQUEST).json({
      success: false,
      message: err.message
    });
  }

  res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: "Something went wrong"
  });
};

