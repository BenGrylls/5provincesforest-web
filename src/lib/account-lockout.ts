/**
 * Account Lockout Tracking
 * 
 * Tracks failed login attempts and enforces account lockout
 * after exceeding threshold (exponential backoff)
 */

type Bucket = { attempts: number; lastAttempt: number; lockedUntil: number };

const LOCKOUT_CONFIG = {
  maxAttempts: 5, // Max failed attempts before lockout
  baseWindow: 15 * 60 * 1000, // Base window: 15 minutes
  lockoutDuration: 30 * 60 * 1000, // Lockout: 30 minutes
};

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function sweep() {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    // Clean up old entries
    if (bucket.lastAttempt + LOCKOUT_CONFIG.baseWindow < now && bucket.lockedUntil < now) {
      buckets.delete(key);
    }
  }
}

// รวม ip เข้าไปใน key กัน attacker กระจายความพยายามไปหลาย IP เพื่อไม่ให้โดนล็อกแต่ยังถล่ม username เดิมได้
function bucketKey(ip: string, username: string): string {
  return `${ip}|${username.toLowerCase()}`;
}

/**
 * Check if username is locked out
 */
export function isAccountLocked(ip: string, username: string): boolean {
  if (buckets.size > MAX_BUCKETS) sweep();

  const key = bucketKey(ip, username);
  const bucket = buckets.get(key);

  if (!bucket) return false;
  return bucket.lockedUntil > Date.now();
}

/**
 * Get remaining lockout time in seconds
 */
export function getLockoutTimeRemaining(ip: string, username: string): number {
  const key = bucketKey(ip, username);
  const bucket = buckets.get(key);

  if (!bucket) return 0;
  return Math.max(0, Math.ceil((bucket.lockedUntil - Date.now()) / 1000));
}

/**
 * Record a failed login attempt
 * @returns true if account is now locked, false otherwise
 */
export function recordFailedAttempt(ip: string, username: string): boolean {
  const key = bucketKey(ip, username);
  const now = Date.now();
  const bucket = buckets.get(key) || { attempts: 0, lastAttempt: 0, lockedUntil: 0 };

  // Reset attempt counter if outside the base window
  if (bucket.lastAttempt + LOCKOUT_CONFIG.baseWindow < now) {
    bucket.attempts = 0;
  }

  bucket.attempts += 1;
  bucket.lastAttempt = now;

  // Lock account if max attempts exceeded
  if (bucket.attempts >= LOCKOUT_CONFIG.maxAttempts) {
    // Use exponential backoff: base duration * attempts / maxAttempts
    const multiplier = Math.floor(bucket.attempts / LOCKOUT_CONFIG.maxAttempts);
    bucket.lockedUntil = now + LOCKOUT_CONFIG.lockoutDuration * Math.pow(1.5, multiplier);
  }

  buckets.set(key, bucket);
  sweep();

  return bucket.attempts >= LOCKOUT_CONFIG.maxAttempts;
}

/**
 * Clear failed attempts on successful login
 */
export function clearFailedAttempts(ip: string, username: string) {
  const key = bucketKey(ip, username);
  buckets.delete(key);
  sweep();
}

/**
 * Get current attempt count for a username
 */
export function getAttemptCount(ip: string, username: string): number {
  const key = bucketKey(ip, username);
  const bucket = buckets.get(key);
  if (!bucket) return 0;

  // Reset if outside window
  if (bucket.lastAttempt + LOCKOUT_CONFIG.baseWindow < Date.now()) {
    return 0;
  }

  return bucket.attempts;
}
