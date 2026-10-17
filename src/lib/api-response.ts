import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { RateLimitResult } from "./rate-limiter";

export const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate",
  "Pragma": "no-cache",
};

export interface ApiResponseOptions {
  status?: number;
  rateLimit?: RateLimitResult;
  headers?: Record<string, string>;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: unknown;
}

// Custom Application Error Hierarchy
export class AppError extends Error {
  statusCode: number;
  errorCode: string;
  details?: unknown;

  constructor(message: string, statusCode = 400, errorCode = "BAD_REQUEST", details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Invalid request payload.", details?: unknown) {
    super(message, 400, "BAD_REQUEST", details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required.") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Insufficient permissions to perform this action.") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Requested resource not found.") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict encountered.", details?: unknown) {
    super(message, 409, "CONFLICT", details);
  }
}

export class InsufficientStockError extends ConflictError {
  constructor(message = "Insufficient inventory stock for requested items.", details?: unknown) {
    super(message, details);
    this.errorCode = "INSUFFICIENT_STOCK";
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Rate limit exceeded. Please try again later.", details?: unknown) {
    super(message, 429, "RATE_LIMIT_EXCEEDED", details);
  }
}

/**
 * Creates a standardized Next.js JSON response adhering to Arc-AA standards.
 * Injects mandatory security and financial privacy headers.
 */
export function jsonResponse<T>(
  body: T,
  options: ApiResponseOptions = {}
): NextResponse {
  const { status = 200, rateLimit, headers = {} } = options;
  const responseHeaders = new Headers();

  // Inject baseline security & financial cache protection headers
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    responseHeaders.set(k, v);
  }

  // Inject caller-provided headers
  for (const [k, v] of Object.entries(headers)) {
    responseHeaders.set(k, v);
  }

  // Inject sliding-window rate limit telemetry
  if (rateLimit) {
    responseHeaders.set("X-RateLimit-Limit", rateLimit.limit.toString());
    responseHeaders.set("X-RateLimit-Remaining", rateLimit.remaining.toString());
    responseHeaders.set("X-RateLimit-Reset", rateLimit.resetAt.toString());
    if (rateLimit.retryAfterSeconds) {
      responseHeaders.set("Retry-After", rateLimit.retryAfterSeconds.toString());
    }
  }

  return NextResponse.json(body, { status, headers: responseHeaders });
}

/**
 * Standard error response formatter mapping Zod, Prisma, and domain errors
 * to normalized HTTP error envelopes without exposing internal stack traces.
 */
export function handleApiError(error: unknown, rateLimit?: RateLimitResult): NextResponse {
  if (error instanceof AppError) {
    return jsonResponse<ApiErrorResponse>(
      {
        success: false,
        error: error.errorCode,
        message: error.message,
        details: error.details,
      },
      { status: error.statusCode, rateLimit }
    );
  }

  if (error instanceof ZodError) {
    const formattedErrors = error.issues.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));

    return jsonResponse<ApiErrorResponse>(
      {
        success: false,
        error: "VALIDATION_ERROR",
        message: "Invalid request payload format or boundaries.",
        details: formattedErrors,
      },
      { status: 400, rateLimit }
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: Unique constraint failed
    if (error.code === "P2002") {
      const target = (error.meta?.target as string[])?.join(", ") || "field";
      return jsonResponse<ApiErrorResponse>(
        {
          success: false,
          error: "CONFLICT",
          message: `A record with this ${target} already exists.`,
        },
        { status: 409, rateLimit }
      );
    }

    // P2025: Record to update or delete not found
    if (error.code === "P2025") {
      return jsonResponse<ApiErrorResponse>(
        {
          success: false,
          error: "NOT_FOUND",
          message: "The requested record was not found.",
        },
        { status: 404, rateLimit }
      );
    }

    // P2003: Foreign key constraint violation
    if (error.code === "P2003") {
      return jsonResponse<ApiErrorResponse>(
        {
          success: false,
          error: "BAD_REQUEST",
          message: "Foreign key reference does not exist.",
        },
        { status: 400, rateLimit }
      );
    }
  }

  // Catch unhandled unexpected server errors - mask stack traces
  console.error("❌ Unhandled Internal API Error:", error);

  return jsonResponse<ApiErrorResponse>(
    {
      success: false,
      error: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred. Please try again later.",
    },
    { status: 500, rateLimit }
  );
}
