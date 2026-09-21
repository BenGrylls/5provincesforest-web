import { createHash } from 'crypto';

// In-memory limiter เหมาะกับ deployment แบบ VM/VPS เดี่ยว (ตามดีไซน์ของโปรเจกต์นี้)
// ถ้าวิ่งหลาย instance ต้องเปลี่ยนไปใช้ Redis แทน
type Bucket = { count: number; resetAt: number };

const ATTEMPTS_LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 นาที
const buckets = new Map<string, Bucket>();

// กัน Map โตไม่จำกัดจาก IP ปลอมหลายพันตัว
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
 * คืน true ถ้า "อนุญาตให้พยายามต่อ" — false = โดน block ชั่วคราว
 * เรียก "ก่อน" ตรวจรหัสผ่าน แล้วค่อยเรียก recordFailure() เมื่อ login ไม่สำเร็จ
 */
export function checkLoginAllowed(request: Request, username: string): boolean {
  if (buckets.size > MAX_BUCKETS) sweep();
  const now = Date.now();
  const bucket = buckets.get(keyFor(request, username));
  if (!bucket || bucket.resetAt <= now) return true;
  return bucket.count < ATTEMPTS_LIMIT;
}

/** เรียกเมื่อ login ล้มเหลวเท่านั้น — สำเร็จไม่ต้องเรียก */
export function recordLoginFailure(request: Request, username: string) {
  const key = keyFor(request, username);
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    bucket.count += 1;
  }
  sweep();
}

function keyFor(request: Request, username: string): string {
  // hash กันเก็บ username ดิบไว้ใน memory
  return createHash('sha256').update(`${clientIp(request)}|${username.toLowerCase()}`).digest('hex');
}

/** คืนวินาทีที่เหลือก่อนลองใหม่ได้ (สำหรับ response ให้ client แสดง) */
export function retryAfterSeconds(request: Request, username: string): number {
  const bucket = buckets.get(keyFor(request, username));
  if (!bucket) return 0;
  return Math.max(0, Math.ceil((bucket.resetAt - Date.now()) / 1000));
}