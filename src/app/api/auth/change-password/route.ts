import { NextResponse } from 'next/server';
import { ADMIN_ROLE_COOKIE, ADMIN_USERNAME_COOKIE, isAuthenticated } from '@/lib/auth';
import { query } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/security';

function cookieValue(request: Request, name: string) {
  return request.headers.get('cookie')?.split(';').map((value) => value.trim()).find((value) => value.startsWith(`${name}=`))?.slice(name.length + 1);
}

export async function POST(request: Request) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const username = cookieValue(request, ADMIN_USERNAME_COOKIE);
  const role = cookieValue(request, ADMIN_ROLE_COOKIE);
  const { currentPassword, newPassword } = await request.json();
  if (role !== 'sub_admin' || !username || typeof currentPassword !== 'string' || typeof newPassword !== 'string' || newPassword.length < 8) {
    return NextResponse.json({ error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร' }, { status: 400 });
  }
  const result = await query('SELECT password_hash FROM sub_admins WHERE username = $1', [username]);
  if (!result.rows[0] || !await verifyPassword(currentPassword, result.rows[0].password_hash)) {
    return NextResponse.json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' }, { status: 400 });
  }
  await query('UPDATE sub_admins SET password_hash = $1 WHERE username = $2', [await hashPassword(newPassword), username]);
  return NextResponse.json({ success: true });
}