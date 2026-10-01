/**
 * Performance Monitoring Middleware
 * Tracks all API requests and logs performance metrics
 * 
 * Usage: Add to next.config.js or middleware.ts
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logPerformance } from '@/lib/performance-logger';

/**
 * Middleware to track API performance
 * Measures response time and logs to performance_logs table
 * 
 * Add to middleware.ts:
 * ```typescript
 * import { performanceMiddleware } from '@/lib/performance-middleware';
 * 
 * export const middleware = performanceMiddleware;
 * export const config = {
 *   matcher: '/api/:path*',
 * };
 * ```
 */
export async function performanceMiddleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname, search } = request.nextUrl;
  const method = request.method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

  try {
    // Call the next middleware/handler
    const response = NextResponse.next();
    
    // Log performance metrics after response
    const responseTimeMs = Date.now() - startTime;
    const statusCode = response.status || 200;

    // Extract user ID from session/auth if available
    let userId: string | undefined;
    try {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        // Parse JWT token to get user ID
        // This is a placeholder - implement based on your auth scheme
        userId = undefined;
      }
    } catch {
      // Silently ignore auth parsing errors
    }

    // Log asynchronously (non-blocking)
    logPerformance({
      endpoint: pathname,
      method,
      statusCode,
      responseTimeMs,
      userId,
      details: {
        query_string: search,
      },
    }).catch((error) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Middleware Performance Log Error]', error);
      }
    });

    return response;
  } catch (error) {
    // Log error response
    const responseTimeMs = Date.now() - startTime;
    logPerformance({
      endpoint: pathname,
      method,
      statusCode: 500,
      responseTimeMs,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    }).catch((err) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Middleware Performance Log Error]', err);
      }
    });

    throw error;
  }
}

/**
 * Performance wrapper function for individual route handlers
 * Use this if middleware is not feasible
 * 
 * Usage in route:
 * ```typescript
 * export const GET = withPerformanceTracking(
 *   async (request: Request) => {
 *     return NextResponse.json({ data: 'test' });
 *   },
 *   { endpoint: '/api/cms' }
 * );
 * ```
 */
export function withPerformanceTracking(
  handler: (request: Request) => Promise<Response>,
  options?: {
    endpoint?: string;
    includeQueryCount?: boolean;
  }
) {
  return async (request: Request) => {
    const startTime = Date.now();
    const url = new URL(request.url);
    const pathname = options?.endpoint || url.pathname;
    const method = request.method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

    try {
      const response = await handler(request);
      const responseTimeMs = Date.now() - startTime;

      // Log performance metrics
      logPerformance({
        endpoint: pathname,
        method,
        statusCode: response.status,
        responseTimeMs,
        details: {
          wrapped_handler: true,
        },
      }).catch((error) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('[withPerformanceTracking Error]', error);
        }
      });

      return response;
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      
      logPerformance({
        endpoint: pathname,
        method,
        statusCode: 500,
        responseTimeMs,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }).catch((err) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('[withPerformanceTracking Error]', err);
        }
      });

      throw error;
    }
  };
}
