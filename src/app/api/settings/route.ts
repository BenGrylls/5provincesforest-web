import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isAuthenticated, isSuperAdminRequest } from '@/lib/auth';

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
  // เดิมขอแค่ "ล็อกอินแล้ว" ทำให้ sub-admin คนไหนก็สั่งเปิดโหมดขาวดำทั้งเว็บได้
  // ทั้งที่หน้า /admin/settings สงวนไว้ให้ super admin เท่านั้น
  // (src/proxy.ts กัน sub-admin ไว้แค่ระดับ UX ไม่ได้กันการยิง API ตรงๆ)
  if (!isAuthenticated(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!await isSuperAdminRequest(request)) return NextResponse.json({ error: 'ไม่มีสิทธิ์แก้ไขการตั้งค่าเว็บไซต์' }, { status: 403 });
  try {
    const body = await request.json();
    await query(
      'UPDATE site_settings SET is_grayscale = $1 WHERE id = $2',
      [Boolean(body.isGrayscale), 'global']
    );
    return NextResponse.json({ success: true, isGrayscale: Boolean(body.isGrayscale) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
