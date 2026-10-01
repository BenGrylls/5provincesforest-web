import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  const result = await query('SELECT image_data, image_mime, image_path FROM committee_profiles WHERE id = $1', ['president']);
  const president = result.rows[0];
  if (president?.image_data) {
    const mime = ['image/jpeg', 'image/png', 'image/webp'].includes(president.image_mime)
      ? president.image_mime : 'image/jpeg';
    return new NextResponse(president.image_data, { headers: { 'Content-Type': mime, 'Cache-Control': 'public, max-age=300' } });
  }
  // กัน open redirect — ยอมให้ redirect เฉพาะไฟล์ที่อัปโหลดในระบบเท่านั้น
  if (president?.image_path?.startsWith('/uploads/')) return NextResponse.redirect(new URL(president.image_path, request.url));
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}