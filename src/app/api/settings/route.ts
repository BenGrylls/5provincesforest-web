import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAdminSession, isAuthenticated, isSuperAdminRequest } from '@/lib/auth';
import { logCsrfBlocked, logForbidden, writeAuditLog } from '@/lib/audit-log';
import { sameOrigin } from '@/lib/csrf';
import { invalidateGrayscaleCache } from '@/lib/settings-cache';

export async function GET(request: Request) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const res = await query('SELECT is_grayscale FROM site_settings WHERE id = $1', ['global']);
    if (res.rows.length > 0) {
      return NextResponse.json({ isGrayscale: res.rows[0].is_grayscale });
    }
    return NextResponse.json({ isGrayscale: false });
  } catch (e) {
    return NextResponse.json({ isGrayscale: false });
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    await logCsrfBlocked(request);
    return NextResponse.json({ error: 'CSRF check failed' }, { status: 403 });
  }
  // เดิมขอแค่ "ล็อกอินแล้ว" ทำให้ sub-admin คนไหนก็สั่งเปิดโหมดขาวดำทั้งเว็บได้
  // ทั้งที่หน้า /admin/settings สงวนไว้ให้ super admin เท่านั้น
  // (src/proxy.ts กัน sub-admin ไว้แค่ระดับ UX ไม่ได้กันการยิง API ตรงๆ)
  if (!isAuthenticated(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!await isSuperAdminRequest(request)) {
    const actor = await getAdminSession(request);
    await logForbidden(request, { username: actor?.username || 'unknown', category: 'settings', reason: 'ไม่ใช่ super admin' });
    return NextResponse.json({ error: 'ไม่มีสิทธิ์แก้ไขการตั้งค่าเว็บไซต์' }, { status: 403 });
  }
  try {
    const body = await request.json();
    await query(
      'UPDATE site_settings SET is_grayscale = $1 WHERE id = $2',
      [Boolean(body.isGrayscale), 'global']
    );
    // ล้าง cache ทันที ไม่งั้นหน้าเว็บจะยังโชว์ค่าเก่าอยู่จนกว่า cache จะหมดอายุ (นานสุด 30 วินาที)
    invalidateGrayscaleCache();
    const actor = await getAdminSession(request);
    await writeAuditLog({
      request,
      username: actor?.username || 'unknown',
      action: 'SETTINGS_UPDATED',
      category: 'settings',
      targetType: 'site_settings',
      targetId: 'global',
      targetTitle: 'โหมดขาวดำทั้งเว็บ',
      detail: { isGrayscale: Boolean(body.isGrayscale) },
    });
    return NextResponse.json({ success: true, isGrayscale: Boolean(body.isGrayscale) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}