import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAdminSession, isAuthenticated, isSuperAdminRequest } from '@/lib/auth';
import { logForbidden } from '@/lib/audit-log';

export async function GET(request: Request) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!await isSuperAdminRequest(request)) {
    const actor = await getAdminSession(request);
    await logForbidden(request, { username: actor?.username || 'unknown', category: 'admin', reason: 'ไม่ใช่ super admin' });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const result = await query('SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT 50');
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}