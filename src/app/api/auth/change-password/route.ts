import { NextResponse } from 'next/server';
import { getAdminSession, isAuthenticated } from '@/lib/auth';
import { logCsrfBlocked, writeAuditLog } from '@/lib/audit-log';
import { sameOrigin } from '@/lib/csrf';
import { query } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/security';
import { revokeSessionsFor } from '@/lib/session-revocation';

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    await logCsrfBlocked(request);
    return NextResponse.json({ error: 'CSRF check failed' }, { status: 403 });
  }
  if (!isAuthenticated(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await getAdminSession(request);
  const username = session?.username;
  const role = session?.role;
  const { currentPassword, newPassword } = await request.json();
  if (role !== 'sub_admin' || !username || typeof currentPassword !== 'string' || typeof newPassword !== 'string' || newPassword.length < 8) {
    return NextResponse.json({ error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร' }, { status: 400 });
  }
  const result = await query('SELECT password_hash FROM sub_admins WHERE username = $1', [username]);
  if (!result.rows[0] || !await verifyPassword(currentPassword, result.rows[0].password_hash)) {
    // กรอกรหัสผ่านปัจจุบันผิด — เก็บ log ไว้ด้วย เผื่อมีคนพยายามสวมรอยบัญชี sub-admin
    await writeAuditLog({
      request,
      username,
      action: 'PASSWORD_CHANGE_FAILED',
      category: 'auth',
      targetType: 'sub_admin',
      targetTitle: username,
      result: 'failed',
    });
    return NextResponse.json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' }, { status: 400 });
  }
  await query('UPDATE sub_admins SET password_hash = $1 WHERE username = $2', [await hashPassword(newPassword), username]);
  // PATCH(4): เพิกถอน session เก่าทั้งหมดของ user นี้ (รวม session ปัจจุบัน) บังคับ login ใหม่ด้วยรหัสผ่านใหม่
  await revokeSessionsFor(username);
  await writeAuditLog({
    request,
    username,
    action: 'PASSWORD_CHANGED',
    category: 'auth',
    targetType: 'sub_admin',
    targetTitle: username,
  });
  return NextResponse.json({ success: true });
}