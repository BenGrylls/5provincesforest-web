/**
 * API Rate Limiting
 * 
 * Prevents abuse and DoS attacks by limiting request rates
 * per IP address for sensitive operations
 */

type Bucket = { count: number; resetAt: number };

// Rate limit configurations for different endpoint types
const RATE_LIMITS = {
  // Mutations (POST, PATCH, PUT, DELETE) - 30 requests per 60 seconds
  mutation: { limit: 30, windowMs: 60 * 1000 },
  // Upload endpoints - 10 uploads per 60 seconds
  upload: { limit: 10, windowMs: 60 * 1000 },
  // Change password - 5 attempts per 15 minutes
  passwordChange: { limit: 5, windowMs: 15 * 60 * 1000 },
};

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

function sweep() {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Check if request is allowed under rate limit
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(
  request: Request,
  limitType: keyof typeof RATE_LIMITS,
): boolean {
  if (buckets.size > MAX_BUCKETS) sweep();

  const config = RATE_LIMITS[limitType];
  const now = Date.now();
  const key = `${limitType}:${clientIp(request)}`;
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) return true;
  return bucket.count < config.limit;
}

/**
 * Record a request for rate limiting
 */
export function recordRequest(
  request: Request,
  limitType: keyof typeof RATE_LIMITS,
) {
  const config = RATE_LIMITS[limitType];
  const key = `${limitType}:${clientIp(request)}`;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + config.windowMs });
  } else {
    bucket.count += 1;
  }

  sweep();
}

/**
 * Get remaining time in seconds before rate limit resets
 */
export function getRateLimitResetSeconds(
  request: Request,
  limitType: keyof typeof RATE_LIMITS,
): number {
  const key = `${limitType}:${clientIp(request)}`;
  const bucket = buckets.get(key);
  if (!bucket) return 0;
  return Math.max(0, Math.ceil((bucket.resetAt - Date.now()) / 1000));
}

/**
 * Get current rate limit status
 */
export function getRateLimitStatus(
  request: Request,
  limitType: keyof typeof RATE_LIMITS,
) {
  const config = RATE_LIMITS[limitType];
  const key = `${limitType}:${clientIp(request)}`;
  const bucket = buckets.get(key);
  const now = Date.now();

  if (!bucket || bucket.resetAt <= now) {
    return {
      remaining: config.limit,
      reset: Math.ceil((now + config.windowMs) / 1000),
    };
  }

  return {
    remaining: Math.max(0, config.limit - bucket.count),
    reset: Math.ceil(bucket.resetAt / 1000),
  };
}
