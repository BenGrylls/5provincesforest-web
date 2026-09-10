import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_ROLE_COOKIE, ADMIN_USERNAME_COOKIE, isAuthConfigured, isValidLogin, SESSION_COOKIE } from '@/lib/auth';
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

    const cookieStore = await cookies();
    cookieStore.set({
      name: SESSION_COOKIE,
      value: process.env.ADMIN_SESSION_TOKEN!,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
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
