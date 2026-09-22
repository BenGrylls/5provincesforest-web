import { NextResponse } from 'next/server';
import { getAdminSession, isAuthenticated, isSuperAdminRequest } from '@/lib/auth';
import { logCsrfBlocked, logForbidden, writeAuditLog } from '@/lib/audit-log';
import { sameOrigin } from '@/lib/csrf';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/security';
import { isPermission } from '@/lib/permissions';
import { revokeSessionsFor } from '@/lib/session-revocation';

/** กรองเฉพาะสิทธิ์ที่มีอยู่จริง เดิมรับ string อะไรก็ได้ พิมพ์ผิดก็บันทึกลงฐานข้อมูลแล้วไม่มีผลอะไร */
function cleanPermissions(value: unknown) {
  return Array.isArray(value) ? Array.from(new Set(value.filter(isPermission))) : [];
}

export async function GET(request: Request) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!await isSuperAdminRequest(request)) {
    const actor = await getAdminSession(request);
    await logForbidden(request, { username: actor?.username || 'unknown', category: 'admin', reason: 'ไม่ใช่ super admin' });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const result = await query('SELECT id, name, username, permissions, created_at FROM sub_admins ORDER BY created_at DESC');
  return NextResponse.json(result.rows);
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    await logCsrfBlocked(request);
    return NextResponse.json({ error: 'CSRF check failed' }, { status: 403 });
  }
  if (!isAuthenticated(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!await isSuperAdminRequest(request)) {
    const actor = await getAdminSession(request);
    await logForbidden(request, { username: actor?.username || 'unknown', category: 'admin', reason: 'ไม่ใช่ super admin' });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { name, username, password, permissions } = await request.json();
  if (typeof name !== 'string' || typeof username !== 'string' || typeof password !== 'string' || !name.trim() || !username.trim() || password.length < 8) {
    return NextResponse.json({ error: 'กรุณาระบุชื่อ Username และรหัสผ่านอย่างน้อย 8 ตัวอักษร' }, { status: 400 });
  }
  try {
    const result = await query(
      'INSERT INTO sub_admins (name, username, password_hash, permissions) VALUES ($1, $2, $3, $4) RETURNING id, name, username, permissions',
      [name.trim(), username.trim(), await hashPassword(password), cleanPermissions(permissions)],
    );
    const created = result.rows[0];
    const actor = await getAdminSession(request);
    await writeAuditLog({
      request,
      username: actor?.username || 'unknown',
      action: 'SUB_ADMIN_CREATED',
      category: 'admin',
      targetType: 'sub_admin',
      targetId: created.id,
      targetTitle: created.username,
      detail: { name: created.name, permissions: created.permissions },
    });
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Username นี้ถูกใช้งานแล้ว' }, { status: 409 });
  }
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) {
    await logCsrfBlocked(request);
    return NextResponse.json({ error: 'CSRF check failed' }, { status: 403 });
  }
  if (!isAuthenticated(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!await isSuperAdminRequest(request)) {
    const actor = await getAdminSession(request);
    await logForbidden(request, { username: actor?.username || 'unknown', category: 'admin', reason: 'ไม่ใช่ super admin' });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id, permissions } = await request.json();
  if (!Number.isSafeInteger(id) || !Array.isArray(permissions)) {
    return NextResponse.json({ error: 'ข้อมูลสิทธิ์ไม่ถูกต้อง' }, { status: 400 });
  }
  // ดึงสิทธิ์เดิมไว้เทียบก่อนแก้ ใส่ลง detail ของ log
  const before = await query('SELECT permissions FROM sub_admins WHERE id = $1', [id]);
  const beforePermissions = before.rows[0]?.permissions ?? [];

  const result = await query(
    'UPDATE sub_admins SET permissions = $1 WHERE id = $2 RETURNING id, name, username, permissions',
    [cleanPermissions(permissions), id],
  );
  if (!result.rows[0]) return NextResponse.json({ error: 'ไม่พบบัญชี Sub-Admin' }, { status: 404 });
  // PATCH(4): เพิกถอน session เก่าของ user นี้ทันที กัน session ที่มีสิทธิ์แบบก่อนแก้ยังใช้งานต่อได้
  await revokeSessionsFor(result.rows[0].username);

  const actor = await getAdminSession(request);
  await writeAuditLog({
    request,
    username: actor?.username || 'unknown',
    action: 'PERMISSIONS_CHANGED',
    category: 'admin',
    targetType: 'sub_admin',
    targetId: result.rows[0].id,
    targetTitle: result.rows[0].username,
    detail: { before: beforePermissions, after: result.rows[0].permissions },
  });

  return NextResponse.json(result.rows[0]);
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) {
    await logCsrfBlocked(request);
    return NextResponse.json({ error: 'CSRF check failed' }, { status: 403 });
  }
  if (!isAuthenticated(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!await isSuperAdminRequest(request)) {
    const actor = await getAdminSession(request);
    await logForbidden(request, { username: actor?.username || 'unknown', category: 'admin', reason: 'ไม่ใช่ super admin' });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isSafeInteger(id)) return NextResponse.json({ error: 'ไม่พบบัญชีที่ต้องการลบ' }, { status: 400 });

  const target = await query('SELECT username, name, permissions FROM sub_admins WHERE id = $1', [id]);
  if (!target.rows[0]) return NextResponse.json({ error: 'ไม่พบบัญชี Sub-Admin' }, { status: 404 });
  const { username, name, permissions } = target.rows[0];

  await query('DELETE FROM sub_admins WHERE id = $1', [id]);

  const actor = await getAdminSession(request);
  await writeAuditLog({
    request,
    username: actor?.username || 'unknown',
    action: 'SUB_ADMIN_DELETED',
    category: 'admin',
    targetType: 'sub_admin',
    targetId: id,
    targetTitle: username,
    detail: { name, permissions },
  });
  // บันทึกแยกอีกรายการ ระบุชัดว่า session ของบัญชีนี้ถูกตัดทันที (แม้จะเป็นผลพลอยได้จากการลบแถวข้อมูลอยู่แล้ว)
  await writeAuditLog({
    request,
    username: actor?.username || 'unknown',
    action: 'SESSIONS_REVOKED',
    category: 'admin',
    targetType: 'sub_admin',
    targetId: id,
    targetTitle: username,
    detail: { reason: 'sub_admin_deleted' },
  });

  return NextResponse.json({ success: true });
}