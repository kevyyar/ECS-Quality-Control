type LogContext = Record<string, unknown>;

type SafeLogPayload = {
  context?: LogContext;
  error?: {
    name: string;
    message: string;
  };
};

const REDACTED = "[redacted]";
const SENSITIVE_KEY_PATTERN = /password|secret|token|serviceRole|apiKey|anonKey/i;
const SENSITIVE_EVIDENCE_PATTERN = /storagePath|storageUrl|photo(?!Count)|file|blob|buffer|bytes/i;
const STORAGE_FILE_PATTERN = /\b[\w-]+\/[\w./-]+\.(?:jpe?g|png|webp)\b/gi;

function shouldRedactKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERN.test(key) || SENSITIVE_EVIDENCE_PATTERN.test(key);
}

function sanitizeValue(value: unknown): unknown {
  if (value instanceof Error) {
    return { name: value.name, message: sanitizeText(value.message) };
  }

  if (typeof value === "string") {
    return sanitizeText(value);
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === "object") {
    return sanitizeContext(value as LogContext);
  }

  return value;
}

export function sanitizeContext(context: LogContext): LogContext {
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [
      key,
      shouldRedactKey(key) ? REDACTED : sanitizeValue(value),
    ]),
  );
}

function sanitizeText(value: string): string {
  return value.replace(STORAGE_FILE_PATTERN, REDACTED);
}

function errorPayload(error: unknown, context?: LogContext): SafeLogPayload {
  const payload: SafeLogPayload = {
    error: error instanceof Error
      ? { name: error.name, message: sanitizeText(error.message) }
      : { name: "UnknownError", message: "Non-Error throw value" },
  };

  if (context) {
    payload.context = sanitizeContext(context);
  }

  return payload;
}

export function logOperationalInfo(event: string, context?: LogContext): void {
  console.info("[ecs-qc]", event, context ? sanitizeContext(context) : {});
}

export function logOperationalError(
  event: string,
  error: unknown,
  context?: LogContext,
): void {
  console.error("[ecs-qc]", event, errorPayload(error, context));
}
