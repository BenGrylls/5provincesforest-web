import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_ROLE_COOKIE, ADMIN_USERNAME_COOKIE, createSessionToken, isAuthConfigured, isValidLogin, SESSION_COOKIE } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit-log';
import { query } from '@/lib/db';
import { verifyPassword } from '@/lib/security';
// PATCH(1): rate limiting + audit log ของความพยายามที่ล้มเหลว
import { checkLoginAllowed, recordLoginFailure, retryAfterSeconds } from '@/lib/rate-limit';
import { isAccountLocked, recordFailedAttempt, clearFailedAttempts, getLockoutTimeRemaining } from '@/lib/account-lockout';
// PATCH(2): Security and error logging
import { logFailedLoginAttempt, logRateLimitExceeded } from '@/lib/security-logger';
import { logException } from '@/lib/application-logger';

// เดิมใช้ secure: process.env.NODE_ENV === 'production' — แต่ `next start` ตั้ง NODE_ENV=production
// เสมอไม่ว่าจะ serve ผ่าน HTTP หรือ HTTPS จริง ทำให้เข้าเว็บผ่าน HTTP ในวงแลน (ไม่มี TLS) แล้ว cookie
// ไม่ถูกเก็บเลย (เบราว์เซอร์ปฏิเสธ Secure cookie บน HTTP) — เปลี่ยนมาเช็คจาก request จริงแทน
// เชื่อ x-forwarded-proto ก่อน เพราะถ้ามี reverse proxy (Nginx/Cloudflare) คั่นอยู่ Next.js จะเห็น
// request เป็น http เสมอแม้ browser คุยกับ proxy ด้วย https จริง (TLS terminate ที่ proxy)
function isHttpsRequest(request: Request): boolean {
  const forwardedProto = request.headers.get('x-forwarded-proto');
  if (forwardedProto) return forwardedProto.split(',')[0].trim() === 'https';
  return new URL(request.url).protocol === 'https:';
}

// เอา ip เข้า key ของ account-lockout ด้วย กันผู้โจมตีกระจายความพยายามหลาย IP แล้วล็อกบัญชี admin จริง (เหมือน clientIp ใน lib/rate-limit.ts)
function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!isAuthConfigured()) {
      return NextResponse.json(
        { error: 'Server authentication is not configured' },
        { status: 503 }
      );
    }

    // PATCH(1): block ถ้าพยายามเกิน 5 ครั้งใน 15 นาที (ต่อ IP+username)
    const uname = typeof username === 'string' ? username : '';
    if (!checkLoginAllowed(request, uname)) {
      // Log security incident
      await logRateLimitExceeded(request, '/api/auth/login', 'passwordChange');
      await writeAuditLog({
        request,
        username: uname || 'unknown',
        action: 'LOGIN_RATE_LIMITED',
        category: 'auth',
        targetType: 'session',
        targetTitle: uname || 'unknown',
        result: 'forbidden',
      });
      return NextResponse.json(
        { error: 'พยายามล็อกอินมากเกินไป กรุณารอสักครู่แล้วลองอีกครั้ง' },
        { status: 429, headers: { 'Retry-After': String(retryAfterSeconds(request, uname)) } }
      );
    }

    // Check account lockout (exponential backoff after failed attempts)
    const ip = clientIp(request);
    if (uname && isAccountLocked(ip, uname)) {
      const remainingSeconds = getLockoutTimeRemaining(ip, uname);
      await writeAuditLog({
        request,
        username: uname,
        action: 'LOGIN_ACCOUNT_LOCKED',
        category: 'auth',
        targetType: 'session',
        targetTitle: uname,
        result: 'locked',
      });
      return NextResponse.json(
        { error: `บัญชีนี้ถูกล็อกชั่วคราว กรุณารอ ${remainingSeconds} วินาที` },
        { status: 429, headers: { 'Retry-After': String(remainingSeconds) } }
      );
    }

    let isValid = await isValidLogin(username, password);
    let role = 'super_admin';
    let authenticatedUsername = username;

    if (!isValid && typeof username === 'string' && typeof password === 'string') {
      const result = await query('SELECT username, password_hash FROM sub_admins WHERE username = $1', [username]);
      const subAdmin = result.rows[0];
      if (subAdmin && await verifyPassword(password, subAdmin.password_hash)) {
        isValid = true;
        role = 'sub_admin';
        authenticatedUsername = subAdmin.username;
      }
    }
    if (!isValid) {
      // PATCH(1): นับความพยายามที่ล้มเหลว + บันทึกลง admin_logs (fail2ban ยึดจาก log นี้ได้)
      const isNowLocked = recordFailedAttempt(ip, uname);
      recordLoginFailure(request, uname);
      
      // Log security incident
      await logFailedLoginAttempt(request, uname, 'invalid_credentials');
      
      // เดิมต้องยัด IP ใส่ target_title เพราะไม่มีคอลัมน์ ip_address ตอนนี้มีคอลัมน์จริงแล้ว เก็บแยกให้ถูกที่
      await writeAuditLog({
        request,
        username: uname || 'unknown',
        action: 'LOGIN_FAILED',
        category: 'auth',
        targetType: 'session',
        targetTitle: uname || 'unknown',
        result: 'failed',
      });

      // Alert if account just locked
      if (isNowLocked) {
        const remainingSeconds = getLockoutTimeRemaining(ip, uname);
        return NextResponse.json(
          { error: `บัญชีถูกล็อกเนื่องจากพยายามล็อกอินล้มเหลวหลายครั้ง กรุณารอ ${remainingSeconds} วินาที` },
          { status: 429, headers: { 'Retry-After': String(remainingSeconds) } }
        );
      }

      return NextResponse.json(
        { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    // Clear lockout on successful login
    if (uname) {
      clearFailedAttempts(ip, uname);
    }

    // เดิม: ใช้ ADMIN_SESSION_TOKEN (ค่าคงที่ตัวเดียว) เป็น cookie ให้ทุกคนใช้ร่วมกัน
    // ตอนนี้: ออก token ที่เซ็น username + role ไว้ในตัวเอง เฉพาะ session นี้เท่านั้น
    // (ดู src/lib/session.js) ทำให้ role ปลอมแปลงผ่าน cookie ตรงๆ ไม่ได้อีกต่อไป
    const sessionToken = createSessionToken(authenticatedUsername, role as 'super_admin' | 'sub_admin');

    const cookieStore = await cookies();
    cookieStore.set({
      name: SESSION_COOKIE,
      value: sessionToken,
      httpOnly: true,
      secure: isHttpsRequest(request),
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours — ต้องตรงกับ ttlMs เริ่มต้นใน createSessionToken
    });
    cookieStore.set({ name: ADMIN_ROLE_COOKIE, value: role, httpOnly: true, secure: isHttpsRequest(request), sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 });
    cookieStore.set({ name: ADMIN_USERNAME_COOKIE, value: authenticatedUsername, httpOnly: true, secure: isHttpsRequest(request), sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 });

    await writeAuditLog({
      request,
      username: authenticatedUsername,
      action: 'LOGIN_SUCCESS',
      category: 'auth',
      targetType: 'session',
      targetTitle: authenticatedUsername,
      detail: { role },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // Log error untuk debugging
    await logException(error, {
      endpoint: '/api/auth/login',
      action: 'login_attempt',
    });
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    );
  }
}