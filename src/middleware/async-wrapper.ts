import { Request, Response, NextFunction } from 'express';
import { ResponseHandler } from '../utils/response-handler';
import { HttpError } from '../utils/http-error';
import { mapPrismaError } from '../utils/map-prisma-error';
import logger from '../utils/logger';
import { AsyncFunction } from '../types';

export function asyncWrapper(fn: AsyncFunction) {
  return async (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      return await fn(request, response, next);
    } catch (err: any) {
      const prismaErr = mapPrismaError(err);

      if (prismaErr) {
        return ResponseHandler.error(
          response,
          prismaErr.code,
          prismaErr,
          prismaErr.status,
        );
      }

      if (err instanceof HttpError) {
        return ResponseHandler.error(
          response,
          101,
          err,
          err.statusCode,
        );
      }

      logger.error(
        `Unhandled error in asyncWrapper: ${err?.message}`,
        err,
      );

      return ResponseHandler.error(
        response,
        999,
        err,
        500,
      );
    }
  };
}