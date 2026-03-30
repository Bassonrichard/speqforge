/**
 * Custom error types for SeqForge Portal
 */

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class InvalidKeyError extends ApiError {
  constructor(provider: string, message?: string) {
    super(400, `Invalid or missing API key for ${provider}${message ? ': ' + message : ''}`, 'INVALID_KEY');
    this.name = 'InvalidKeyError';
  }
}

export class LLMError extends ApiError {
  constructor(message: string, public provider?: string) {
    super(503, `LLM provider error: ${message}`, 'LLM_ERROR');
    this.name = 'LLMError';
  }
}

export class RateLimitError extends LLMError {
  constructor(provider: string, retryAfter?: number) {
    super(`Rate limit exceeded${retryAfter ? ` - retry after ${retryAfter}s` : ''}`, provider);
    this.statusCode = 429;
    this.code = 'RATE_LIMIT';
    this.name = 'RateLimitError';
  }
}

export class SyncError extends ApiError {
  constructor(message: string, public repos?: { name: string; error: string }[]) {
    super(500, `Sync error: ${message}`, 'SYNC_ERROR');
    this.name = 'SyncError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, public fieldName?: string) {
    super(400, `Validation error: ${message}`, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(401, message, 'AUTHENTICATION_REQUIRED');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Insufficient permissions') {
    super(403, message, 'AUTHORIZATION_FAILED');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string, id?: string) {
    const msg = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(404, msg, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, message, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

/**
 * Type guard to check if error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Safe error response formatter for API responses
 */
export function errorResponse(error: unknown) {
  if (isApiError(error)) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
    };
  }

  if (error instanceof Error) {
    return {
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: error.message,
    };
  }

  return {
    statusCode: 500,
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
  };
}
