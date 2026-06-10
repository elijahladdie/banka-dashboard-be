import { Request, Response, NextFunction } from 'express';
import { AppError } from './AppError';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    logger.warn(`Operational error: ${err.message}`, {
      errorCode: err.errorCode,
      statusCode: err.statusCode,
    });

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: err.errorCode,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  // Prisma known request errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as any;
    if (prismaErr.code === 'P2002') {
      res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: 'A record with this value already exists.',
        error: ERROR_CODES.CONFLICT,
      });
      return;
    }
    if (prismaErr.code === 'P2025') {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Record not found.',
        error: ERROR_CODES.NOT_FOUND,
      });
      return;
    }
  }

  // Prisma validation errors
  if (err.name === 'PrismaClientValidationError') {
    res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
      success: false,
      message: 'Invalid data provided.',
      error: ERROR_CODES.VALIDATION_ERROR,
    });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Invalid token.',
      error: ERROR_CODES.INVALID_TOKEN,
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Token has expired.',
      error: ERROR_CODES.TOKEN_EXPIRED,
    });
    return;
  }

  // Unknown errors
  logger.error(`Unexpected error: ${err.message}`, { stack: err.stack });

  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred.'
        : err.message,
    error: ERROR_CODES.INTERNAL_ERROR,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
