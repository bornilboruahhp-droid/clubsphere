export type ErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "INVALID_STATE"
  | "INTERNAL_ERROR";

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly fields?: Record<string, string>;

  constructor(
    code: ErrorCode,
    status: number,
    message: string,
    fields?: Record<string, string>
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.fields = fields;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export function unauthenticated(message = "Authentication required"): ApiError {
  return new ApiError("UNAUTHENTICATED", 401, message);
}

export function forbidden(message = "Access forbidden"): ApiError {
  return new ApiError("FORBIDDEN", 403, message);
}

export function notFound(message = "Resource not found"): ApiError {
  return new ApiError("NOT_FOUND", 404, message);
}

export function validationError(
  message = "Validation failed",
  fields?: Record<string, string>
): ApiError {
  return new ApiError("VALIDATION_ERROR", 400, message, fields);
}

export function conflict(
  message = "Conflict occurred",
  fields?: Record<string, string>
): ApiError {
  return new ApiError("CONFLICT", 409, message, fields);
}

export function invalidState(message = "Invalid state transition"): ApiError {
  return new ApiError("INVALID_STATE", 409, message);
}

export function internal(message = "An unexpected error occurred"): ApiError {
  return new ApiError("INTERNAL_ERROR", 500, message);
}
