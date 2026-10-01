/**
 * Trend Analysis for Performance Logs
 * Analyzes performance trends over time
 */

import { query as dbQuery } from '@/lib/db';

export interface PerformanceTrend {
  date: string;
  avgResponseTime: number;
  maxResponseTime: number;
  requestCount: number;
  errorCount: number;
  errorRate: number; // percentage
  slowCount: number; // > 2000ms
}

export interface EndpointComparison {
  endpoint: string;
  avgResponseTime: number;
  maxResponseTime: number;
  requestCount: number;
  errorCount: number;
  errorRate: number;
  trend: 'improving' | 'stable' | 'degrading';
}

export interface PerformanceAlert {
  type: 'slow_endpoint' | 'high_error_rate' | 'regression' | 'spike';
  endpoint: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metric: number;
  threshold: number;
  timestamp: Date;
}

/**
 * Get performance trend over last N days
 * @param endpoint API endpoint to analyze
 * @param days Number of days to analyze (default: 7)
 */
export async function getPerformanceTrend(
  endpoint: string,
  days: number = 7
): Promise<PerformanceTrend[] | null> {
  try {
    const result = await dbQuery(
      `SELECT 
        DATE(created_at) as date,
        ROUND(AVG(response_time_ms)::numeric, 2) as avg_response_time,
        MAX(response_time_ms) as max_response_time,
        COUNT(*) as request_count,
        COUNT(*) FILTER (WHERE status_code >= 400) as error_count,
        ROUND(100.0 * COUNT(*) FILTER (WHERE status_code >= 400) / COUNT(*)::numeric, 2) as error_rate,
        COUNT(*) FILTER (WHERE response_time_ms > 2000) as slow_count
       FROM performance_logs
       WHERE endpoint = $1
       AND created_at >= NOW() - INTERVAL '1 day' * $2
       AND created_at >= NOW() - INTERVAL '120 days'
       GROUP BY DATE(created_at)
       ORDER BY DATE(created_at) DESC`,
      [endpoint, days]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows.map((row) => ({
      date: new Date(row.date).toISOString().split('T')[0],
      avgResponseTime: parseFloat(row.avg_response_time || 0),
      maxResponseTime: row.max_response_time || 0,
      requestCount: row.request_count || 0,
      errorCount: row.error_count || 0,
      errorRate: parseFloat(row.error_rate || 0),
      slowCount: row.slow_count || 0,
    }));
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Trend Analysis Error]', error);
    }
    return null;
  }
}

/**
 * Compare performance across all endpoints
 * @param days Number of days to compare (default: 7)
 */
export async function compareEndpoints(days: number = 7): Promise<EndpointComparison[] | null> {
  try {
    const result = await dbQuery(
      `WITH endpoint_stats AS (
        SELECT 
          endpoint,
          ROUND(AVG(response_time_ms)::numeric, 2) as avg_response_time,
          MAX(response_time_ms) as max_response_time,
          COUNT(*) as request_count,
          COUNT(*) FILTER (WHERE status_code >= 400) as error_count,
          ROUND(100.0 * COUNT(*) FILTER (WHERE status_code >= 400) / COUNT(*)::numeric, 2) as error_rate
         FROM performance_logs
         WHERE created_at >= NOW() - INTERVAL '1 day' * $1
         AND created_at >= NOW() - INTERVAL '120 days'
         GROUP BY endpoint
       ),
       endpoint_trend AS (
         SELECT 
           endpoint,
           ROUND(AVG(response_time_ms)::numeric, 2) as avg_7day,
           (
             SELECT ROUND(AVG(response_time_ms)::numeric, 2)
             FROM performance_logs
             WHERE endpoint = endpoint_stats.endpoint
             AND created_at >= NOW() - INTERVAL '1 day' * ($1 - 7)
             AND created_at < NOW() - INTERVAL '1 day' * $1
             AND created_at >= NOW() - INTERVAL '120 days'
           ) as avg_prev_7day
         FROM endpoint_stats
       )
       SELECT 
         es.endpoint,
         es.avg_response_time,
         es.max_response_time,
         es.request_count,
         es.error_count,
         es.error_rate,
         CASE 
           WHEN et.avg_prev_7day IS NULL THEN 'stable'
           WHEN et.avg_7day < et.avg_prev_7day * 0.95 THEN 'improving'
           WHEN et.avg_7day > et.avg_prev_7day * 1.05 THEN 'degrading'
           ELSE 'stable'
         END as trend
       FROM endpoint_stats es
       JOIN endpoint_trend et ON es.endpoint = et.endpoint
       ORDER BY es.avg_response_time DESC`,
      [days]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows.map((row) => ({
      endpoint: row.endpoint,
      avgResponseTime: parseFloat(row.avg_response_time || 0),
      maxResponseTime: row.max_response_time || 0,
      requestCount: row.request_count || 0,
      errorCount: row.error_count || 0,
      errorRate: parseFloat(row.error_rate || 0),
      trend: row.trend as 'improving' | 'stable' | 'degrading',
    }));
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Endpoint Comparison Error]', error);
    }
    return null;
  }
}

/**
 * Detect performance anomalies (potential issues)
 * @param thresholds Custom thresholds for alerts
 */
export async function detectAnomalies(thresholds?: {
  slowResponseTime?: number; // ms, default: 2000
  highErrorRate?: number;     // %, default: 5
}): Promise<PerformanceAlert[]> {
  const slowThreshold = thresholds?.slowResponseTime || 2000;
  const errorThreshold = thresholds?.highErrorRate || 5;
  const alerts: PerformanceAlert[] = [];

  try {
    // Detect slow endpoints
    const slowResult = await dbQuery(
      `SELECT 
        endpoint,
        ROUND(AVG(response_time_ms)::numeric, 2) as avg_response_time,
        COUNT(*) as request_count
       FROM performance_logs
       WHERE created_at >= NOW() - INTERVAL '24 hours'
       AND created_at >= NOW() - INTERVAL '120 days'
       GROUP BY endpoint
       HAVING AVG(response_time_ms) > $1
       ORDER BY AVG(response_time_ms) DESC
       LIMIT 10`,
      [slowThreshold]
    );

    slowResult.rows.forEach((row) => {
      const avgTime = parseFloat(row.avg_response_time);
      alerts.push({
        type: 'slow_endpoint',
        endpoint: row.endpoint,
        severity: avgTime > 5000 ? 'critical' : avgTime > 3000 ? 'high' : 'medium',
        message: `Endpoint ${row.endpoint} averaging ${avgTime}ms (threshold: ${slowThreshold}ms)`,
        metric: avgTime,
        threshold: slowThreshold,
        timestamp: new Date(),
      });
    });

    // Detect high error rates
    const errorResult = await dbQuery(
      `SELECT 
        endpoint,
        COUNT(*) as request_count,
        COUNT(*) FILTER (WHERE status_code >= 400) as error_count,
        ROUND(100.0 * COUNT(*) FILTER (WHERE status_code >= 400) / COUNT(*)::numeric, 2) as error_rate
       FROM performance_logs
       WHERE created_at >= NOW() - INTERVAL '24 hours'
       AND created_at >= NOW() - INTERVAL '120 days'
       GROUP BY endpoint
       HAVING 100.0 * COUNT(*) FILTER (WHERE status_code >= 400) / COUNT(*)::numeric > $1
       AND COUNT(*) > 10
       ORDER BY error_rate DESC
       LIMIT 10`,
      [errorThreshold]
    );

    errorResult.rows.forEach((row) => {
      const errorRate = parseFloat(row.error_rate);
      alerts.push({
        type: 'high_error_rate',
        endpoint: row.endpoint,
        severity: errorRate > 20 ? 'critical' : errorRate > 10 ? 'high' : 'medium',
        message: `Endpoint ${row.endpoint} has ${errorRate}% error rate (threshold: ${errorThreshold}%)`,
        metric: errorRate,
        threshold: errorThreshold,
        timestamp: new Date(),
      });
    });

    // Detect performance regressions (compared to previous 7 days)
    const regressionResult = await dbQuery(
      `WITH current_stats AS (
        SELECT 
          endpoint,
          ROUND(AVG(response_time_ms)::numeric, 2) as current_avg
         FROM performance_logs
         WHERE created_at >= NOW() - INTERVAL '24 hours'
         AND created_at >= NOW() - INTERVAL '120 days'
         GROUP BY endpoint
       ),
       previous_stats AS (
         SELECT 
           endpoint,
           ROUND(AVG(response_time_ms)::numeric, 2) as previous_avg
          FROM performance_logs
          WHERE created_at >= NOW() - INTERVAL '8 days'
          AND created_at < NOW() - INTERVAL '1 day'
          AND created_at >= NOW() - INTERVAL '120 days'
          GROUP BY endpoint
       )
       SELECT 
         c.endpoint,
         c.current_avg,
         p.previous_avg,
         ROUND(100.0 * (c.current_avg - p.previous_avg) / p.previous_avg::numeric, 2) as regression_pct
        FROM current_stats c
        JOIN previous_stats p ON c.endpoint = p.endpoint
        WHERE c.current_avg > p.previous_avg * 1.25
        ORDER BY regression_pct DESC
        LIMIT 10`,
      []
    );

    regressionResult.rows.forEach((row) => {
      const regressionPct = parseFloat(row.regression_pct);
      alerts.push({
        type: 'regression',
        endpoint: row.endpoint,
        severity: regressionPct > 50 ? 'critical' : regressionPct > 25 ? 'high' : 'medium',
        message: `Endpoint ${row.endpoint} degraded by ${regressionPct}% (${row.current_avg}ms vs ${row.previous_avg}ms)`,
        metric: regressionPct,
        threshold: 25,
        timestamp: new Date(),
      });
    });

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Anomaly Detection Error]', error);
    }
    return [];
  }
}

/**
 * Get detailed endpoint statistics
 */
export async function getEndpointStats(endpoint: string): Promise<{
  stats: any;
  trend: PerformanceTrend[] | null;
  alerts: PerformanceAlert[];
} | null> {
  try {
    // Get current stats
    const statsResult = await dbQuery(
      `SELECT 
        endpoint,
        COUNT(*) as request_count,
        ROUND(AVG(response_time_ms)::numeric, 2) as avg_response_time,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) as p95_response_time,
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY response_time_ms) as p99_response_time,
        MIN(response_time_ms) as min_response_time,
        MAX(response_time_ms) as max_response_time,
        COUNT(*) FILTER (WHERE status_code >= 400) as error_count,
        ROUND(100.0 * COUNT(*) FILTER (WHERE status_code >= 400) / COUNT(*)::numeric, 2) as error_rate,
        COUNT(*) FILTER (WHERE response_time_ms > 2000) as slow_count
       FROM performance_logs
       WHERE endpoint = $1
       AND created_at >= NOW() - INTERVAL '7 days'
       AND created_at >= NOW() - INTERVAL '120 days'
       GROUP BY endpoint`,
      [endpoint]
    );

    if (statsResult.rows.length === 0) {
      return null;
    }

    const stats = statsResult.rows[0];

    // Get trends
    const trend = await getPerformanceTrend(endpoint, 7);

    // Get related alerts
    const allAlerts = await detectAnomalies();
    const relatedAlerts = allAlerts.filter((a) => a.endpoint === endpoint);

    return {
      stats: {
        endpoint: stats.endpoint,
        requestCount: stats.request_count,
        avgResponseTime: parseFloat(stats.avg_response_time || 0),
        p95ResponseTime: stats.p95_response_time || 0,
        p99ResponseTime: stats.p99_response_time || 0,
        minResponseTime: stats.min_response_time || 0,
        maxResponseTime: stats.max_response_time || 0,
        errorCount: stats.error_count || 0,
        errorRate: parseFloat(stats.error_rate || 0),
        slowCount: stats.slow_count || 0,
      },
      trend,
      alerts: relatedAlerts,
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Endpoint Stats Error]', error);
    }
    return null;
  }
}
