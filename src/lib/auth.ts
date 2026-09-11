import { timingSafeEqual } from 'crypto';
import { verifyPassword } from './security';
import { verifySessionToken } from './session.js';
import { query } from './db';

const SESSION_COOKIE = 'admin_token';

function configured(value: string | undefined): value is string {
  return Boolean(value && value.length >= 16);
}

function present(value: string | undefined): value is string {
  return Boolean(value && value.length > 0);
}

function safelyMatches(value: string, expected: string) {
  try {
    const actual = Buffer.from(value);
    const target = Buffer.from(expected);
    return actual.length === target.length && timingSafeEqual(actual, target);
  } catch {
    return false;
  }
}

/**
 * Validate login credentials
 * Supports both hashed and plaintext passwords for backward compatibility
 */
export async function isValidLogin(username: unknown, password: unknown) {
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (typeof username !== 'string' || typeof password !== 'string') {
    return false;
  }

  if (!present(expectedUsername) || !present(expectedPassword)) {
    return false;
  }

  // Username comparison (timing-safe)
  if (!safelyMatches(username, expectedUsername)) {
    return false;
  }

  // Password comparison
  // Try bcrypt hash first (if password starts with $2a$ or $2b$ or $2y$)
  if (expectedPassword.startsWith('$2')) {
    try {
      return await verifyPassword(password, expectedPassword);
    } catch {
      return false;
    }
  }

  // Fallback to plaintext comparison (timing-safe) for backward compatibility
  return safelyMatches(password, expectedPassword);
}

/**
 * Check if request has valid authentication token.
 * Uses the standard Cookie header, supported by all route handler requests.
 *
 * ตรวจลายเซ็น (HMAC) ของ token แทนการเทียบกับ ADMIN_SESSION_TOKEN ตรงๆ
 * เพราะตอนนี้ token ถูกออกใหม่ทุกครั้งที่ login (ไม่ใช่ค่าคงที่ตัวเดียวที่ทุกคนใช้ร่วมกัน)
 * ADMIN_SESSION_TOKEN ยังถูกใช้เป็น "secret" สำหรับเซ็น/ตรวจลายเซ็นอยู่เหมือนเดิม
 * จึงไม่ต้องเพิ่ม environment variable ใหม่
 */
export function isAuthenticated(request: Request) {
  if (!configured(process.env.ADMIN_SESSION_TOKEN)) {
    return false;
  }

  const token = readCookie(request, SESSION_COOKIE);
  return token !== undefined && verifySessionToken(token) !== null;
}

/**
 * Check if authentication is properly configured
 */
export function isAuthConfigured() {
  return present(process.env.ADMIN_USERNAME)
    && present(process.env.ADMIN_PASSWORD)
    && configured(process.env.ADMIN_SESSION_TOKEN);
}

export { SESSION_COOKIE };
export { createSessionToken } from './session.js';
export const ADMIN_ROLE_COOKIE = 'admin_role';
export const ADMIN_USERNAME_COOKIE = 'admin_username';

export type ContentCategory = 'news' | 'media' | 'publications';

const CATEGORY_PERMISSIONS: Record<ContentCategory, string> = {
  news: 'ข่าวสารและกิจกรรม',
  media: 'สื่อและสารคดีธรรมชาติ',
  publications: 'คลังเอกสารและวารสาร',
};

function readCookie(request: Request, name: string) {
  return request.headers
    .get('cookie')
    ?.split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

/**
 * คืนค่า session ของผู้ใช้ปัจจุบัน โดย username/role มาจาก "token ที่เซ็นแล้ว" เท่านั้น
 * (ไม่ใช่จาก cookie admin_role/admin_username ธรรมดา ซึ่งฝั่ง client แก้ไขเองได้
 * และเป็นช่องโหว่ privilege escalation เดิม — ดูคอมเมนต์ใน src/lib/session.js)
 */
export async function getAdminSession(request: Request) {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;
  const verified = verifySessionToken(token);
  if (!verified) return null;

  const { username, role } = verified;
  if (role !== 'sub_admin') {
    return { role: 'super_admin' as const, username, permissions: Object.values(CATEGORY_PERMISSIONS) };
  }
  const result = await query('SELECT permissions FROM sub_admins WHERE username = $1', [username]);
  return { role: 'sub_admin' as const, username, permissions: Array.isArray(result.rows[0]?.permissions) ? result.rows[0].permissions : [] };
}

/**
 * ใช้แทนฟังก์ชัน isSuperAdmin ที่แต่ละ route เคยเขียนเองแยกกัน (sub-admins, logs,
 * important-cover) ซึ่งอ่าน cookie admin_role ตรงๆ โดยไม่ตรวจลายเซ็น
 */
export async function isSuperAdminRequest(request: Request) {
  const session = await getAdminSession(request);
  return Boolean(session && session.role === 'super_admin');
}

export async function canAccessCategory(request: Request, category: ContentCategory) {
  const session = await getAdminSession(request);
  return Boolean(session && (session.role === 'super_admin' || session.permissions.includes(CATEGORY_PERMISSIONS[category])));
}

export async function canManageCommittee(request: Request) {
  const session = await getAdminSession(request);
  return Boolean(session && (session.role === 'super_admin' || session.permissions.includes('โครงสร้างคณะกรรมการ')));
}

export async function canManageHistory(request: Request) {
  const session = await getAdminSession(request);
  return Boolean(session && (session.role === 'super_admin' || session.permissions.includes('ประวัติความเป็นมา')));
}
