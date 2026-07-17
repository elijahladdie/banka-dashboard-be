import { Request, Response, NextFunction } from 'express';
import { ResponseHandler } from '../utils/response-handler';
import { HttpError } from '../utils/http-error';
import { mapPrismaError } from '../utils/map-prisma-error';
import logger from '../utils/logger';
import { AsyncFunction } from '../types';

function isErrorLike(err: unknown): err is { message: string } {
  return typeof err === 'object' && err !== null && 'message' in err;
}

export function asyncWrapper(fn: AsyncFunction) {
  return async (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      return await fn(request, response, next);
    } catch (err) {
      const error = err as Error;
      const prismaErr = mapPrismaError(error);

      if (prismaErr) {
        return ResponseHandler.error(
          response,
          prismaErr.code,
          prismaErr,
          prismaErr.status,
        );
      }

      if (error instanceof HttpError) {
        return ResponseHandler.error(
          response,
          101,
          error,
          error.statusCode,
        );
      }

      logger.error(
        `Unhandled error in asyncWrapper: ${error?.message}`,
        error,
      );

      return ResponseHandler.error(
        response,
        999,
        error,
        500,
      );
    }
  };
}