export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public emptyData: unknown = null,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string = 'Resource not found', emptyData: unknown = []) {
    super(404, message, emptyData);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string = 'Unauthorized') {
    super(401, message);
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string = 'Request invalid') {
    super(400, message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string = 'Access forbidden') {
    super(403, message);
  }
}

export class ConflictError extends HttpError {
  constructor(message: string = 'Resource conflict') {
    super(409, message);
  }
}

export class ExpiredError extends HttpError {
  constructor(message: string = 'Resource expired') {
    super(410, message);
  }
}

export class ServerError extends HttpError {
  constructor(message: string = 'Server error') {
    super(500, message);
  }
}

export class RateLimitError extends HttpError {
  constructor(message: string = 'Too many requests. Please try again later.') {
    super(429, message);
  }
}
