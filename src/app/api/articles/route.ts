import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  
  let result;
  if (category) {
    result = await query('SELECT * FROM articles WHERE category = $1 ORDER BY created_at DESC', [category]);
  } else {
    result = await query('SELECT * FROM articles ORDER BY created_at DESC');
  }
  return NextResponse.json(result.rows);
}

export async function POST(request: Request) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const result = await query(
    'INSERT INTO articles (title, category, content) VALUES ($1, $2, $3) RETURNING *',
    [body.title, body.category || 'news', body.content || '']
  );
  return NextResponse.json(result.rows[0]);
}

export async function DELETE(request: Request) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  await query('DELETE FROM articles WHERE id = $1', [id]);
  return NextResponse.json({ success: true });
}
