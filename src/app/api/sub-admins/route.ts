import { NextResponse } from 'next/server';
import { isAuthenticated, isSuperAdminRequest } from '@/lib/auth';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/security';

export async function GET(request: Request) {
  if (!isAuthenticated(request) || !await isSuperAdminRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const result = await query('SELECT id, name, username, permissions, created_at FROM sub_admins ORDER BY created_at DESC');
  return NextResponse.json(result.rows);
}

export async function POST(request: Request) {
  if (!isAuthenticated(request) || !await isSuperAdminRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { name, username, password, permissions } = await request.json();
  if (typeof name !== 'string' || typeof username !== 'string' || typeof password !== 'string' || !name.trim() || !username.trim() || password.length < 8) {
    return NextResponse.json({ error: 'กรุณาระบุชื่อ Username และรหัสผ่านอย่างน้อย 8 ตัวอักษร' }, { status: 400 });
  }
  try {
    const result = await query(
      'INSERT INTO sub_admins (name, username, password_hash, permissions) VALUES ($1, $2, $3, $4) RETURNING id, name, username, permissions',
      [name.trim(), username.trim(), await hashPassword(password), Array.isArray(permissions) ? permissions : []],
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Username นี้ถูกใช้งานแล้ว' }, { status: 409 });
  }
}

export async function PATCH(request: Request) {
  if (!isAuthenticated(request) || !await isSuperAdminRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, permissions } = await request.json();
  if (!Number.isSafeInteger(id) || !Array.isArray(permissions) || !permissions.every((permission) => typeof permission === 'string')) {
    return NextResponse.json({ error: 'ข้อมูลสิทธิ์ไม่ถูกต้อง' }, { status: 400 });
  }
  const result = await query(
    'UPDATE sub_admins SET permissions = $1 WHERE id = $2 RETURNING id, name, username, permissions',
    [permissions, id],
  );
  if (!result.rows[0]) return NextResponse.json({ error: 'ไม่พบบัญชี Sub-Admin' }, { status: 404 });
  return NextResponse.json(result.rows[0]);
}