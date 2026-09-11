import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_ROLE_COOKIE, ADMIN_USERNAME_COOKIE, SESSION_COOKIE } from '@/lib/auth';

export async function POST() {
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
  return NextResponse.json({ success: true });
}
