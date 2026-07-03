import { Request, Response, NextFunction } from 'express';
import { ResponseHandler } from '../utils/response-handler';
import { HttpError } from '../utils/http-error';
import { mapPrismaError } from '../utils/map-prisma-error';
import logger from '../utils/logger';

export function asyncWrapper(fn: (request: Request, response: Response) => Promise<any>) {
  return async (request: Request, reply: Response, _next: NextFunction) => {
    try {
      return await fn(request, reply);
    } catch (err: any) {
      console.log(err)
      const prismaErr = mapPrismaError(err);
      if (prismaErr) {
        return ResponseHandler.error(reply, prismaErr.code, prismaErr, prismaErr.status);
      }
      if (err instanceof HttpError) {
        return ResponseHandler.error(reply, 101, err, err.statusCode);
      }

      logger.error('Unhandled error in asyncWrapper: ' + err.message, err);
      return ResponseHandler.error(reply, 999, err, 500);
    }
  };
}
