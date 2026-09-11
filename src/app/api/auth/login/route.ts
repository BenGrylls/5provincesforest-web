import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_ROLE_COOKIE, ADMIN_USERNAME_COOKIE, createSessionToken, isAuthConfigured, isValidLogin, SESSION_COOKIE } from '@/lib/auth';
import { query } from '@/lib/db';
import { verifyPassword } from '@/lib/security';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!isAuthConfigured()) {
      return NextResponse.json(
        { error: 'Server authentication is not configured' },
        { status: 503 }
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
      return NextResponse.json(
        { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
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
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours — ต้องตรงกับ ttlMs เริ่มต้นใน createSessionToken
    });
    cookieStore.set({ name: ADMIN_ROLE_COOKIE, value: role, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 });
    cookieStore.set({ name: ADMIN_USERNAME_COOKIE, value: authenticatedUsername, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    );
  }
}
