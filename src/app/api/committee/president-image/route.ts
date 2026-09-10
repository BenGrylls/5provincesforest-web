import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  const result = await query('SELECT image_data, image_mime, image_path FROM committee_profiles WHERE id = $1', ['president']);
  const president = result.rows[0];
  if (president?.image_data) {
    return new NextResponse(president.image_data, { headers: { 'Content-Type': president.image_mime || 'image/jpeg', 'Cache-Control': 'public, max-age=300' } });
  }
  if (president?.image_path) return NextResponse.redirect(new URL(president.image_path, request.url));
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}