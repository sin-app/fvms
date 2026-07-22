type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

// Request-scoped correlation id. Uses a module-level holder that is only
// meaningful in a single serverless invocation (server-side). On the client
// it is simply absent — no node: imports so this file bundles everywhere.
const g = globalThis as unknown as { __fvmsRequestId?: string };

export function withRequestId<T>(id: string, fn: () => T): T {
  const prev = g.__fvmsRequestId;
  g.__fvmsRequestId = id;
  try {
    return fn();
  } finally {
    g.__fvmsRequestId = prev;
  }
}

export function getRequestId(): string | undefined {
  return g.__fvmsRequestId;
}

function emit(level: LogLevel, message: string, context?: LogContext) {
  const requestId = getRequestId();
  const entry = {
    level,
    msg: message,
    time: new Date().toISOString(),
    ...(requestId ? { request_id: requestId } : {}),
    ...context,
  };
  if (level === "error") {
    // eslint-disable-next-line no-console
    console.error(JSON.stringify(entry));
  } else if (level === "warn") {
    // eslint-disable-next-line no-console
    console.warn(JSON.stringify(entry));
  } else {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== "production") emit("debug", message, context);
  },
  info(message: string, context?: LogContext) {
    emit("info", message, context);
  },
  warn(message: string, context?: LogContext) {
    emit("warn", message, context);
  },
  error(message: string, context?: LogContext) {
    emit("error", message, context);
  },
};
