import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export type AppErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "VALIDATION"
  | "INTERNAL";

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    message: string,
    opts: { code: AppErrorCode; status: number; details?: unknown; cause?: unknown },
  ) {
    super(message, opts.cause !== undefined ? { cause: opts.cause } : undefined);
    this.name = "AppError";
    this.code = opts.code;
    this.status = opts.status;
    this.details = opts.details;
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(message, { code: "BAD_REQUEST", status: 400, details });
  }
  static unauthorized(message = "Unauthorized") {
    return new AppError(message, { code: "UNAUTHORIZED", status: 401 });
  }
  static forbidden(message = "Forbidden") {
    return new AppError(message, { code: "FORBIDDEN", status: 403 });
  }
  static notFound(message = "Not found") {
    return new AppError(message, { code: "NOT_FOUND", status: 404 });
  }
  static conflict(message: string, details?: unknown) {
    return new AppError(message, { code: "CONFLICT", status: 409, details });
  }
  static rateLimited(message = "Too many requests") {
    return new AppError(message, { code: "RATE_LIMITED", status: 429 });
  }
  static internal(message = "Internal server error", details?: unknown) {
    return new AppError(message, { code: "INTERNAL", status: 500, details });
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

export interface ErrorBody {
  error: { message: string; code: AppErrorCode; details?: unknown };
}

export function handleError(err: unknown): { status: number; body: ErrorBody } {
  if (isAppError(err)) {
    if (err.status >= 500) {
      logger.error("AppError (server)", {
        code: err.code,
        message: err.message,
        details: err.details,
      });
    }
    return {
      status: err.status,
      body: {
        error: {
          message: err.message,
          code: err.code,
          ...(err.details !== undefined ? { details: err.details } : {}),
        },
      },
    };
  }
  const message = err instanceof Error ? err.message : "Internal server error";
  logger.error("Unhandled error", {
    message,
    stack: err instanceof Error ? err.stack : undefined,
  });
  return { status: 500, body: { error: { message: "Internal server error", code: "INTERNAL" } } };
}

export function nextErrorResponse(err: unknown): NextResponse {
  const { status, body } = handleError(err);
  return NextResponse.json(body, { status });
}

export function errorMessage(err: unknown): string {
  if (err instanceof AppError) return err.message;
  if (err instanceof Error) return err.message;
  return "Terjadi kesalahan";
}
