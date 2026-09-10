import { NextResponse } from 'next/server';
import { ADMIN_ROLE_COOKIE, isAuthenticated } from '@/lib/auth';
import { query } from '@/lib/db';
import { isImage, saveUpload } from '@/lib/uploads';

function isSuperAdmin(request: Request) {
  const role = request.headers.get('cookie')?.split(';').map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith(`${ADMIN_ROLE_COOKIE}=`))?.slice(`${ADMIN_ROLE_COOKIE}=`.length);
  return role === undefined || role === 'super_admin';
}

export async function GET(request: Request) {
  if (!isAuthenticated(request) || !isSuperAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const result = await query('SELECT important_cover_enabled, important_cover_image, important_cover_title, important_cover_message, important_cover_link, important_cover_link_text, important_cover_subtitle, important_cover_date, important_cover_footer, important_cover_ornament, important_cover_title_size, important_cover_subtitle_size, important_cover_date_size, important_cover_footer_size FROM site_settings WHERE id = $1', ['global']);
  return NextResponse.json(result.rows[0] || {});
}

export async function POST(request: Request) {
  if (!isAuthenticated(request) || !isSuperAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const form = await request.formData();
  const image = form.get('image');
  const ornament = form.get('ornament');
  let imagePath = typeof form.get('existingImage') === 'string' ? String(form.get('existingImage')) : '';
  let ornamentPath = typeof form.get('existingOrnament') === 'string' ? String(form.get('existingOrnament')) : '';
  if (image instanceof File && image.size > 0) {
    if (!isImage(image)) return NextResponse.json({ error: 'รูปภาพต้องเป็น JPG, PNG หรือ WebP' }, { status: 400 });
    imagePath = await saveUpload(image);
  }
  if (ornament instanceof File && ornament.size > 0) {
    if (!isImage(ornament)) return NextResponse.json({ error: 'ลวดลายต้องเป็น JPG, PNG หรือ WebP' }, { status: 400 });
    ornamentPath = await saveUpload(ornament);
  }
  const enabled = form.get('enabled') === 'true';
  const title = String(form.get('title') || '').trim();
  const message = String(form.get('message') || '').trim();
  const link = String(form.get('link') || '').trim();
  const linkText = String(form.get('linkText') || '').trim();
  const subtitle = String(form.get('subtitle') || '').trim();
  const date = String(form.get('date') || '').trim();
  const footer = String(form.get('footer') || '').trim();
  const fontSize = (field: string, fallback: number) => {
    const value = Number(form.get(field));
    return Number.isFinite(value) ? Math.min(72, Math.max(10, Math.round(value))) : fallback;
  };
  if (enabled && (!imagePath || !title)) return NextResponse.json({ error: 'กรุณาระบุรูปภาพและหัวข้อก่อนเปิดใช้งาน' }, { status: 400 });
  if (link && !/^https?:\/\//.test(link) && !link.startsWith('/')) return NextResponse.json({ error: 'ลิงก์ไม่ถูกต้อง' }, { status: 400 });
  await query('UPDATE site_settings SET important_cover_enabled = $1, important_cover_image = $2, important_cover_title = $3, important_cover_message = $4, important_cover_link = $5, important_cover_link_text = $6, important_cover_subtitle = $7, important_cover_date = $8, important_cover_footer = $9, important_cover_ornament = $10, important_cover_title_size = $11, important_cover_subtitle_size = $12, important_cover_date_size = $13, important_cover_footer_size = $14 WHERE id = $15', [enabled, imagePath, title, message, link, linkText, subtitle, date, footer, ornamentPath, fontSize('titleSize', 28), fontSize('subtitleSize', 20), fontSize('dateSize', 16), fontSize('footerSize', 12), 'global']);
  return NextResponse.json({ success: true, imagePath, ornamentPath });
}