import { Response } from 'express';
import { serializeResult } from './serialize';

export class ResponseHandler {
  static success<T>(
    reply: Response,
    data: T,
    message = 'Success',
    resp_code: number = 100,
    statusCode = 200,
  ) {
    const serializedData = serializeResult(data);
    if (data && typeof data === 'object' && 'pagination' in data) {
      return reply.status(statusCode).send({
        success: true,
        resp_msg: message,
        resp_code,
        data: serializeResult((data as unknown as { data: unknown }).data),
        pagination: serializeResult((data as unknown as { pagination: unknown }).pagination),
      });
    }

    return reply.status(statusCode).send({
      success: true,
      resp_code,
      resp_msg: message,
      data: serializedData,
    });
  }

  static error(reply: Response, resp_code: number, error: unknown, statusCode: number = 400) {
    const err = error as { message?: string; details?: unknown } | null;
    return reply.status(statusCode).send({
      success: false,
      resp_code,
      resp_msg: typeof error === 'string' ? error : err?.message || 'generic_error',
      errors: err?.details || null,
    });
  }
}
