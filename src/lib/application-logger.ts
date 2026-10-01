import { query } from './db';

export type LogLevel = 'ERROR' | 'WARN' | 'INFO';

export interface ApplicationLogInput {
  /** ระดับ log (ERROR, WARN, INFO) */
  level: LogLevel;
  /** ข้อความ */
  message: string;
  /** Stack trace (ถ้ามี error) */
  stackTrace?: string;
  /** Endpoint ที่เกิดข้อผิดพลาด */
  endpoint?: string;
  /** User ID (ถ้ามี) */
  userId?: string | null;
  /** Context เพิ่มเติม */
  context?: Record<string, unknown>;
}

/**
 * บันทึก application errors/exceptions/warnings สำหรับ debugging
 * 
 * ตัวอย่าง:
 * - Database connection errors
 * - Unhandled exceptions
 * - Timeout errors
 * - Third-party API failures
 * - File system errors
 * - Unexpected state conditions
 */
export async function logApplicationError({
  level,
  message,
  stackTrace,
  endpoint,
  userId,
  context,
}: ApplicationLogInput): Promise<void> {
  try {
    const contextJson = context ? JSON.stringify(context) : null;
    // Truncate stack trace ไม่ให้เก็บเยอะเกินไป (max 5000 chars)
    const truncatedStack = stackTrace ? stackTrace.substring(0, 5000) : null;

    await query(
      `INSERT INTO application_logs
        (log_level, message, stack_trace, endpoint, user_id, context, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        level,
        message.substring(0, 2000), // truncate message
        truncatedStack,
        endpoint || null,
        userId || null,
        contextJson,
      ],
    );
  } catch (err) {
    // ไม่ throw เพื่อไม่ให้ logging พัง flow
    if (process.env.NODE_ENV === 'development') {
      console.error('[application-logger] Failed to log error:', err);
    }
  }
}

/**
 * Helper: Log caught exception
 */
export async function logException(
  error: Error | unknown,
  context: {
    endpoint?: string;
    userId?: string;
    action?: string;
    [key: string]: unknown;
  },
): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  await logApplicationError({
    level: 'ERROR',
    message,
    stackTrace: stack,
    endpoint: context.endpoint,
    userId: context.userId,
    context,
  });
}

/**
 * Helper: Log database error
 */
export async function logDatabaseError(
  error: Error | unknown,
  query: string,
  endpoint?: string,
): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  await logApplicationError({
    level: 'ERROR',
    message: `Database error: ${message}`,
    stackTrace: stack,
    endpoint,
    context: {
      errorType: 'database',
      query: query.substring(0, 200), // truncate
    },
  });
}

/**
 * Helper: Log timeout error
 */
export async function logTimeoutError(endpoint: string, timeoutMs: number): Promise<void> {
  await logApplicationError({
    level: 'ERROR',
    message: `Request timeout: ${endpoint} exceeded ${timeoutMs}ms`,
    endpoint,
    context: {
      errorType: 'timeout',
      timeoutMs,
    },
  });
}

/**
 * Helper: Log third-party API error
 */
export async function logThirdPartyError(
  service: string,
  error: Error | unknown,
  endpoint?: string,
): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  await logApplicationError({
    level: 'WARN',
    message: `Third-party service error (${service}): ${message}`,
    stackTrace: stack,
    endpoint,
    context: {
      errorType: 'third_party',
      service,
    },
  });
}
