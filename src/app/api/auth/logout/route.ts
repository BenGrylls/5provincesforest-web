import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_ROLE_COOKIE, ADMIN_USERNAME_COOKIE, getAdminSession, SESSION_COOKIE } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit-log';

export async function POST(request: Request) {
  // ต้องอ่าน session ไว้ก่อนเคลียร์ cookie ไม่งั้นจะไม่รู้ว่าใครเป็นคนออกจากระบบ
  const session = await getAdminSession(request);

  // Next 16: cookies() คืน Promise ต้อง await ก่อนใช้ (เดิมเรียก .set() ตรงๆ จึงพัง)
  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE,
    value: '',
    path: '/',
    sameSite: 'lax',
    maxAge: 0,
  });
  cookieStore.set({ name: ADMIN_ROLE_COOKIE, value: '', path: '/', maxAge: 0 });
  cookieStore.set({ name: ADMIN_USERNAME_COOKIE, value: '', path: '/', maxAge: 0 });

  if (session) {
    await writeAuditLog({
      request,
      username: session.username,
      action: 'LOGOUT',
      category: 'auth',
      targetType: 'session',
      targetTitle: session.username,
    });
  }

  return NextResponse.json({ success: true });
}