import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_ROLE_COOKIE, ADMIN_USERNAME_COOKIE, SESSION_COOKIE } from '@/lib/auth';

export async function POST() {
  cookies().set({
    name: SESSION_COOKIE,
    value: '',
    path: '/',
    sameSite: 'lax',
    maxAge: 0,
  });
  cookies().set({ name: ADMIN_ROLE_COOKIE, value: '', path: '/', maxAge: 0 });
  cookies().set({ name: ADMIN_USERNAME_COOKIE, value: '', path: '/', maxAge: 0 });
  return NextResponse.json({ success: true });
}
