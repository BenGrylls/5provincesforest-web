/**
 * Performance Logger - Track API response times and metrics
 * Stores data in performance_logs table with 10% sampling rate
 * 
 * Purpose: Monitor API performance, detect slow endpoints, track trends
 * Retention: 14 days (trending/performance data only)
 */

import { query as dbQuery } from '@/lib/db';

interface PerformanceLogData {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  statusCode: number;
  responseTimeMs: number;
  userId?: string | null;
  queryCount?: number;
  details?: Record<string, any>;
}

/**
 * Sample at 10% rate for performance data (reduce noise)
 * This means 1 in 10 requests are logged
 */
function shouldSample(): boolean {
  return Math.random() < 0.1;
}

/**
 * Log API performance metrics
 * @param data Performance metrics
 * 
 * Usage:
 * ```typescript
 * const startTime = Date.now();
 * try {
 *   // API operation
 * } finally {
 *   const responseTimeMs = Date.now() - startTime;
 *   await logPerformance({
 *     endpoint: '/api/cms',
 *     method: 'GET',
 *     statusCode: 200,
 *     responseTimeMs,
 *     queryCount: 3,
 *   });
 * }
 * ```
 */
export async function logPerformance(data: PerformanceLogData): Promise<void> {
  // Skip silent failures - never throw
  try {
    // Only sample 10% of requests to reduce noise
    if (!shouldSample()) {
      return;
    }

    // Alert on slow endpoints
    if (data.responseTimeMs > 2000) {
      console.warn(`[PERF] Slow endpoint: ${data.endpoint} took ${data.responseTimeMs}ms`);
    }

    await dbQuery(
      `INSERT INTO performance_logs 
       (endpoint, method, status_code, response_time_ms, user_id, query_count, details, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        data.endpoint,
        data.method,
        data.statusCode,
        data.responseTimeMs,
        data.userId || null,
        data.queryCount || null,
        data.details ? JSON.stringify(data.details) : null,
      ]
    );
  } catch (error) {
    // Silent failure - log to console in dev only
    if (process.env.NODE_ENV === 'development') {
      console.error('[Performance Logger Error]', error);
    }
  }
}

/**
 * Log slow query for debugging (when database query takes > 500ms)
 * @param query SQL query
 * @param durationMs Query execution time
 * @param endpoint API endpoint that triggered query
 * 
 * Usage:
 * ```typescript
 * const start = Date.now();
 * const result = await query('SELECT * FROM articles WHERE ...');
 * const duration = Date.now() - start;
 * if (duration > 500) {
 *   await logSlowQuery(sqlString, duration, '/api/cms');
 * }
 * ```
 */
export async function logSlowQuery(
  query: string,
  durationMs: number,
  endpoint: string
): Promise<void> {
  try {
    // Always log slow queries (important for optimization)
    console.warn(`[SLOW_QUERY] ${endpoint} took ${durationMs}ms\n${query.substring(0, 200)}`);

    // Store in details for later analysis
    await logPerformance({
      endpoint,
      method: 'GET', // Assume read, but could be any
      statusCode: 200,
      responseTimeMs: durationMs,
      details: {
        query_type: 'database',
        query_duration_ms: durationMs,
        sample_query: query.substring(0, 200),
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Slow Query Logger Error]', error);
    }
  }
}

/**
 * Get performance statistics for an endpoint
 * Usage: For dashboard, analytics, trend detection
 */
export async function getPerformanceStats(
  endpoint: string,
  hours: number = 24
): Promise<{
  avgResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  requestCount: number;
  slowRequests: number;
} | null> {
  try {
    const result = await dbQuery(
      `SELECT 
        ROUND(AVG(response_time_ms)::numeric, 2) as avg_response_time,
        MAX(response_time_ms) as max_response_time,
        MIN(response_time_ms) as min_response_time,
        COUNT(*) as request_count,
        COUNT(*) FILTER (WHERE response_time_ms > 2000) as slow_requests
       FROM performance_logs
       WHERE endpoint = $1 
       AND created_at >= NOW() - INTERVAL '1 hour' * $2
       AND created_at >= NOW() - INTERVAL '120 days'`,
      [endpoint, hours]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      avgResponseTime: parseFloat(row.avg_response_time || 0),
      maxResponseTime: row.max_response_time || 0,
      minResponseTime: row.min_response_time || 0,
      requestCount: row.request_count || 0,
      slowRequests: row.slow_requests || 0,
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Performance Stats Error]', error);
    }
    return null;
  }
}
