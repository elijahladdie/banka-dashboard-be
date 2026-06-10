import { Request, Response, NextFunction } from 'express';
import { ResponseHandler } from '../utils/response-handler';
import { HttpError } from '../utils/http-error';
import { mapPrismaError } from '../utils/map-prisma-error';
import logger from '../utils/logger';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const prismaErr = mapPrismaError(err);
  if (prismaErr) {
    ResponseHandler.error(res, prismaErr.code, prismaErr, prismaErr.status);
    return;
  }

  if (err instanceof HttpError) {
    ResponseHandler.error(res, 101, err, err.statusCode);
    return;
  }

  logger.error(`Unhandled error: ${err.message}`, err);
  ResponseHandler.error(res, 999, err, 500);
}
