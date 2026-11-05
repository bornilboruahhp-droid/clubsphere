import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError } from "./errors";

export interface ApiResponse<T> {
  data: T;
}

export interface ApiPaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}

/**
 * Standard success response wrapper `{ data: payload }`.
 */
export function ok<T>(data: T, init?: ResponseInit): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data }, init);
}

/**
 * Standard paginated list response wrapper `{ data: [...], nextCursor }`.
 */
export function paginated<T>(
  data: T[],
  nextCursor: string | null,
  init?: ResponseInit
): NextResponse<ApiPaginatedResponse<T>> {
  return NextResponse.json({ data, nextCursor }, init);
}

/**
 * Handles ApiError, ZodError, and unknown runtime errors into unified error response shapes.
 * Prevents internal server details from leaking to clients.
 */
export function handleError(err: unknown): NextResponse<ApiErrorResponse> {
  if (err instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          code: err.code,
          message: err.message,
          ...(err.fields ? { fields: err.fields } : {}),
        },
      },
      { status: err.status }
    );
  }

  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of err.issues) {
      const path = issue.path.join(".") || "root";
      fields[path] = issue.message;
    }

    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          fields,
        },
      },
      { status: 400 }
    );
  }

  console.error("Unhandled API Error:", err);
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    },
    { status: 500 }
  );
}
